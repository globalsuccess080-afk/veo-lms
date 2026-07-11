"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyEnrollments = getMyEnrollments;
exports.checkEnrollment = checkEnrollment;
exports.createEnrollment = createEnrollment;
const enrollment_model_1 = require("./enrollment.model");
const course_model_1 = require("../course/course.model");
const lesson_model_1 = require("../lesson/lesson.model");
const progress_model_1 = require("../progress/progress.model");
const assetPath_1 = require("../../utils/assetPath");
const mongoose_1 = require("mongoose");
async function getMyEnrollments(userId) {
    const enrollments = await enrollment_model_1.Enrollment.find({ userId, isActive: true })
        .populate('courseId')
        .sort({ enrolledAt: -1 })
        .lean();
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const courseObjectIds = enrollments
        .map((e) => {
        const course = e.courseId;
        const courseId = course?._id || e.courseId;
        return mongoose_1.Types.ObjectId.isValid(courseId) ? new mongoose_1.Types.ObjectId(courseId) : null;
    })
        .filter((id) => Boolean(id));
    const [lessonCounts, completedCounts] = await Promise.all([
        lesson_model_1.Lesson.aggregate([
            { $match: { courseId: { $in: courseObjectIds } } },
            { $group: { _id: '$courseId', totalLessons: { $sum: 1 } } }
        ]),
        progress_model_1.Progress.aggregate([
            { $match: { userId: userObjectId, courseId: { $in: courseObjectIds }, isCompleted: true } },
            { $group: { _id: '$courseId', completedLessons: { $sum: 1 } } }
        ])
    ]);
    const lessonCountByCourse = new Map(lessonCounts.map((row) => [row._id.toString(), row.totalLessons]));
    const completedCountByCourse = new Map(completedCounts.map((row) => [row._id.toString(), row.completedLessons]));
    const enrollmentProgressUpdates = [];
    const data = enrollments.map((e) => {
        const course = e.courseId;
        const courseId = course?._id?.toString() || String(e.courseId);
        const totalLessons = lessonCountByCourse.get(courseId) ?? course?.totalLessons ?? 0;
        const completedLessons = completedCountByCourse.get(courseId) ?? 0;
        const progress = totalLessons > 0
            ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
            : 0;
        const completedAt = progress === 100 && totalLessons > 0
            ? e.completedAt || new Date()
            : null;
        if (e.progress !== progress || (e.completedAt || null)?.toString() !== (completedAt || null)?.toString()) {
            enrollmentProgressUpdates.push({
                updateOne: {
                    filter: { _id: e._id },
                    update: { $set: { progress, completedAt } }
                }
            });
        }
        const formattedCourse = course && typeof course === 'object'
            ? { ...course, totalLessons, thumbnail: course.thumbnail ? (0, assetPath_1.formatAssetPath)(course.thumbnail) : course.thumbnail }
            : course;
        return {
            id: e._id.toString(),
            userId: e.userId.toString(),
            courseId,
            enrolledAt: e.enrolledAt.toISOString(),
            completedAt: completedAt?.toISOString() || null,
            isActive: e.isActive,
            progress,
            course: formattedCourse
        };
    });
    if (enrollmentProgressUpdates.length > 0) {
        await enrollment_model_1.Enrollment.bulkWrite(enrollmentProgressUpdates);
    }
    return data;
}
async function checkEnrollment(userId, courseId) {
    const enrollment = await enrollment_model_1.Enrollment.findOne({ userId, courseId, isActive: true });
    return { enrolled: !!enrollment, enrollment };
}
async function createEnrollment(userId, courseId, paymentId, session) {
    const existing = await enrollment_model_1.Enrollment.findOne({ userId, courseId }).session(session || null);
    if (existing)
        return existing;
    const [enrollment] = await enrollment_model_1.Enrollment.create([{ userId, courseId, paymentId }], { session });
    const course = await course_model_1.Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } }, { session });
    const { User } = await Promise.resolve().then(() => __importStar(require('../user/user.model')));
    const user = await User.findById(userId);
    if (user && course) {
        const { emailQueue } = await Promise.resolve().then(() => __importStar(require('../email/email.queue')));
        const { generateEnrollmentEmail } = await Promise.resolve().then(() => __importStar(require('../email/templates')));
        await emailQueue.add('sendEmail', {
            to: user.getDecryptedEmail(),
            subject: `Welcome to ${course.title}`,
            html: generateEnrollmentEmail(course.title)
        });
    }
    return enrollment;
}
