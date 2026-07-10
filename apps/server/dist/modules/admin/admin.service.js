"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = getStats;
exports.getStudents = getStudents;
exports.toggleStudent = toggleStudent;
exports.getAllEnrollments = getAllEnrollments;
exports.sendAnnouncement = sendAnnouncement;
exports.queueExport = queueExport;
exports.queueImport = queueImport;
exports.getJobStatus = getJobStatus;
const user_model_1 = require("../user/user.model");
const course_model_1 = require("../course/course.model");
const enrollment_model_1 = require("../enrollment/enrollment.model");
const payment_model_1 = require("../payment/payment.model");
const notification_model_1 = require("../notification/notification.model");
const apiError_1 = require("../../utils/apiError");
const queryBuilder_1 = require("../../utils/queryBuilder");
const admin_queue_1 = require("./admin.queue");
const completedPaymentStatuses = ['COMPLETED', 'paid'];
async function getStats() {
    const [totalCourses, totalStudents, totalEnrollments, payments] = await Promise.all([
        course_model_1.Course.countDocuments(),
        user_model_1.User.countDocuments({ role: 'student' }),
        enrollment_model_1.Enrollment.countDocuments(),
        payment_model_1.Payment.find({ status: { $in: completedPaymentStatuses } }).lean()
    ]);
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const recentEnrollments = await enrollment_model_1.Enrollment.find()
        .sort({ enrolledAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .populate('courseId', 'title slug')
        .lean();
    return {
        totalCourses,
        totalStudents,
        totalEnrollments,
        totalRevenue,
        recentEnrollments: recentEnrollments.map((e) => {
            const user = e.userId;
            const course = e.courseId;
            return {
                id: e._id.toString(),
                userId: user?._id?.toString() || String(e.userId),
                courseId: course?._id?.toString() || String(e.courseId),
                enrolledAt: e.enrolledAt.toISOString(),
                progress: e.progress,
                course,
                user
            };
        })
    };
}
async function getStudents(query) {
    const { filterQuery, skip, limit, sort, page } = (0, queryBuilder_1.buildQuery)({ ...query, role: 'student' }, ['name']);
    // Since we might search by email (which is encrypted), if search is provided we have to do it in-memory
    // But if the search matched 'name' using DB regex, those will be returned.
    // For email, we will still apply in memory search if 'search' query param exists
    let filter = filterQuery;
    // If search is provided, we fetch a larger set and filter in memory, or we rely on name search.
    // For simplicity and performance, we'll let buildQuery handle name search via regex.
    // We'll also remove the search from filterQuery if it's there to avoid DB breaking on encrypted fields,
    // but wait, `name` is NOT encrypted. We can use buildQuery for `name`.
    // Email is encrypted, so regex search on email won't work in DB. We will just do a secondary in-memory filter if needed.
    const [users, total] = await Promise.all([
        user_model_1.User.find(filter).sort(sort).skip(skip).limit(limit),
        user_model_1.User.countDocuments(filter)
    ]);
    const students = await Promise.all(users.map(async (user) => {
        const enrollments = await enrollment_model_1.Enrollment.countDocuments({ userId: user._id });
        return {
            id: user._id.toString(),
            name: user.getDecryptedName(),
            email: user.getDecryptedEmail(),
            isActive: user.isActive,
            enrollments,
            createdAt: user.createdAt.toISOString()
        };
    }));
    let filtered = students;
    if (query.search) {
        const q = query.search.toLowerCase();
        // Add any missing users that matched by email (which might not be in the current paginated set if we don't fetch all, but doing so is a limitation).
        // The name regex handles the majority.
        filtered = students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    return { students: filtered, total, page, limit, totalPages: Math.ceil(total / limit) };
}
async function toggleStudent(id, isActive) {
    const user = await user_model_1.User.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!user)
        throw new apiError_1.ApiError(404, 'Student not found');
    return { id: user._id.toString(), isActive: user.isActive };
}
async function getAllEnrollments(query) {
    const { filterQuery, skip, limit, sort, page } = (0, queryBuilder_1.buildQuery)(query, []);
    const [enrollments, total] = await Promise.all([
        enrollment_model_1.Enrollment.find(filterQuery).sort(sort).skip(skip).limit(limit)
            .populate('userId').populate('courseId').lean(),
        enrollment_model_1.Enrollment.countDocuments(filterQuery)
    ]);
    return {
        enrollments: enrollments.map((e) => ({
            id: e._id.toString(),
            enrolledAt: e.enrolledAt.toISOString(),
            progress: e.progress,
            isActive: e.isActive,
            user: e.userId,
            course: e.courseId
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}
async function sendAnnouncement(title, message, io) {
    const students = await user_model_1.User.find({ role: 'student', isActive: true });
    const notifications = students.map(s => ({
        userId: s._id,
        type: 'announcement',
        title,
        message,
        link: null
    }));
    await notification_model_1.Notification.insertMany(notifications);
    if (io) {
        io.to('role:student').emit('announcement:broadcast', { title, message });
    }
    return { sent: students.length };
}
async function queueExport(type) {
    const job = await admin_queue_1.adminExportQueue.add('export', { type });
    return { jobId: job.id, message: `Export job for ${type} queued` };
}
async function queueImport(type, filePath) {
    const job = await admin_queue_1.adminImportQueue.add('import', { type, filePath });
    return { jobId: job.id, message: `Import job for ${type} queued` };
}
async function getJobStatus(jobId) {
    // Check export queue first
    let job = await admin_queue_1.adminExportQueue.getJob(jobId);
    if (!job) {
        // Check import queue
        job = await admin_queue_1.adminImportQueue.getJob(jobId);
    }
    if (!job)
        throw new apiError_1.ApiError(404, 'Job not found');
    const state = await job.getState();
    return {
        jobId: job.id,
        state, // 'completed', 'failed', 'active', 'waiting', etc.
        progress: job.progress,
        result: job.returnvalue,
        failedReason: job.failedReason
    };
}
