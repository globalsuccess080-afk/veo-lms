"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../../config/redis");
const logger_1 = require("../../../utils/logger");
const user_model_1 = require("../../user/user.model");
const course_model_1 = require("../../course/course.model");
const progress_model_1 = require("../../progress/progress.model");
const lesson_model_1 = require("../../lesson/lesson.model");
const certificate_model_1 = require("../certificate.model");
const email_queue_1 = require("../../email/email.queue");
const env_1 = require("../../../config/env");
function generateCertificateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
exports.certificateWorker = new bullmq_1.Worker('certificate-generate', async (job) => {
    const { userId, courseId } = job.data;
    logger_1.logger.info(`Processing certificate for user ${userId}, course ${courseId}`);
    const user = await user_model_1.User.findById(userId);
    const course = await course_model_1.Course.findById(courseId);
    if (!user || !course)
        throw new Error('User or Course not found');
    const totalLessons = await lesson_model_1.Lesson.countDocuments({ courseId });
    if (totalLessons === 0)
        throw new Error('Course has no lessons');
    const completedLessons = await progress_model_1.Progress.countDocuments({ userId, courseId, isCompleted: true });
    const progressPct = Math.round((completedLessons / totalLessons) * 100);
    if (progressPct < 85)
        throw new Error(`Insufficient progress (${progressPct}%). Must be >= 85%.`);
    const existing = await certificate_model_1.Certificate.findOne({ userId, courseId });
    if (existing) {
        logger_1.logger.info(`Certificate already exists for user ${userId}, course ${courseId}`);
        return existing;
    }
    const certId = generateCertificateId();
    const certificate = await certificate_model_1.Certificate.create({
        userId,
        courseId,
        certificateId: certId,
        progressPercentage: progressPct,
        issuedAt: new Date(),
        status: 'active',
    });
    await email_queue_1.emailQueue.add('send-email', {
        to: user.email,
        subject: 'Your Course Certificate is Ready!',
        html: `
        <h2>Congratulations!</h2>
        <p>Your certificate has been generated successfully.</p>
        <p><b>Course:</b> ${course.title}</p>
        <p><b>Certificate ID:</b> ${certId}</p>
        <br/>
        <a href="${env_1.env.FRONTEND_URL}/courses/${course.slug}/certificate" style="padding: 10px 20px; background: #0a1a44; color: white; text-decoration: none; border-radius: 5px;">View Certificate</a>
      `,
    });
    logger_1.logger.info(`Certificate generated successfully: ${certId}`);
    return certificate;
}, { connection: redis_1.redis });
exports.certificateWorker.on('completed', (job) => {
    logger_1.logger.info(`Certificate job ${job.id} completed.`);
});
exports.certificateWorker.on('failed', (job, err) => {
    logger_1.logger.error(`Certificate job ${job?.id} failed:`, err);
});
