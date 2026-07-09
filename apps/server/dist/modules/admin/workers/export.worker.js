"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminExportWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../../config/redis");
const logger_1 = require("../../../utils/logger");
const course_model_1 = require("../../course/course.model");
const user_model_1 = require("../../user/user.model");
const enrollment_model_1 = require("../../enrollment/enrollment.model");
exports.adminExportWorker = new bullmq_1.Worker('adminExport', async (job) => {
    logger_1.logger.info(`Processing admin export job ${job.id} for type: ${job.data.type}`);
    const { type } = job.data;
    if (type === 'courses') {
        const courses = await course_model_1.Course.find().lean();
        return courses.map(c => ({
            id: c._id.toString(),
            title: c.title,
            slug: c.slug,
            category: c.category,
            price: c.price,
            isPublished: c.isPublished,
            totalLessons: c.totalLessons
        }));
    }
    if (type === 'students') {
        const students = await user_model_1.User.find({ role: 'student' });
        return students.map(s => ({
            id: s._id.toString(),
            name: s.getDecryptedName(),
            email: s.getDecryptedEmail(),
            isActive: s.isActive,
            joined: s.createdAt.toISOString()
        }));
    }
    if (type === 'enrollments') {
        const enrollments = await enrollment_model_1.Enrollment.find().populate('userId', 'name').populate('courseId', 'title').lean();
        return enrollments.map((e) => ({
            id: e._id.toString(),
            studentName: e.userId?.name || 'Unknown',
            courseTitle: e.courseId?.title || 'Unknown',
            progress: e.progress,
            enrolledAt: e.enrolledAt.toISOString()
        }));
    }
    throw new Error('Unknown export type');
}, { connection: redis_1.redis });
exports.adminExportWorker.on('completed', (job) => {
    logger_1.logger.info(`Admin export job ${job.id} completed successfully`);
});
exports.adminExportWorker.on('failed', (job, err) => {
    logger_1.logger.error(`Admin export job ${job?.id} failed:`, err);
});
