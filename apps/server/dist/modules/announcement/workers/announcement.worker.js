"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../../config/redis");
const announcement_model_1 = require("../announcement.model");
const user_model_1 = require("../../user/user.model");
const enrollment_model_1 = require("../../enrollment/enrollment.model");
const notification_model_1 = require("../../notification/notification.model");
const email_queue_1 = require("../../email/email.queue");
const logger_1 = require("../../../utils/logger");
exports.announcementWorker = new bullmq_1.Worker('announcement', async (job) => {
    const { announcementId } = job.data;
    logger_1.logger.info(`Processing announcement job ${job.id} for announcement ${announcementId}`);
    const announcement = await announcement_model_1.Announcement.findById(announcementId);
    if (!announcement || announcement.isDeleted) {
        logger_1.logger.warn(`Announcement ${announcementId} not found or deleted`);
        return;
    }
    if (announcement.status === 'sent' || announcement.status === 'failed') {
        logger_1.logger.warn(`Announcement ${announcementId} already processed with status ${announcement.status}`);
        return;
    }
    announcement.status = 'processing';
    await announcement.save();
    try {
        let targetUserIds = [];
        if (announcement.audience.type === 'all') {
            const users = await user_model_1.User.find({ role: 'student', isActive: true }).select('_id email').lean();
            targetUserIds = users.map(u => u._id.toString());
        }
        else if (announcement.audience.type === 'course' && announcement.audience.courseId) {
            const enrollments = await enrollment_model_1.Enrollment.find({ courseId: announcement.audience.courseId, isActive: true }).select('userId').lean();
            targetUserIds = enrollments.map(e => e.userId.toString());
        }
        if (targetUserIds.length === 0) {
            announcement.status = 'sent';
            await announcement.save();
            return;
        }
        // 1. Create In-App Notifications
        if (announcement.deliveryChannels.inApp) {
            const notifications = targetUserIds.map(userId => ({
                userId,
                type: 'announcement',
                title: announcement.title,
                message: announcement.message,
                priority: announcement.priority,
                announcementId: announcement._id,
                targetUrl: announcement.targetUrl,
                actionLabel: announcement.actionLabel,
                actionUrl: announcement.actionUrl,
                expiresAt: announcement.expiresAt
            }));
            // Insert in batches if large
            const batchSize = 1000;
            for (let i = 0; i < notifications.length; i += batchSize) {
                await notification_model_1.Notification.insertMany(notifications.slice(i, i + batchSize));
            }
        }
        // 2. Dispatch Emails
        if (announcement.deliveryChannels.email) {
            // Fetch users to get emails
            const users = await user_model_1.User.find({ _id: { $in: targetUserIds }, isActive: true }).select('email name').lean();
            for (const user of users) {
                await email_queue_1.emailQueue.add('send-email', {
                    to: user.email,
                    subject: `VeoLMS: ${announcement.title}`,
                    html: `
              <h2>${announcement.title}</h2>
              <p>${announcement.message.replace(/\n/g, '<br>')}</p>
              ${announcement.actionLabel && announcement.actionUrl ? `<a href="${announcement.actionUrl}" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:5px;">${announcement.actionLabel}</a>` : ''}
            `
                });
            }
        }
        announcement.status = 'sent';
        await announcement.save();
        logger_1.logger.info(`Announcement ${announcementId} sent successfully to ${targetUserIds.length} users`);
    }
    catch (err) {
        logger_1.logger.error(`Error processing announcement ${announcementId}:`, err);
        announcement.status = 'failed';
        await announcement.save();
        throw err;
    }
}, { connection: redis_1.redis });
exports.announcementWorker.on('completed', (job) => {
    logger_1.logger.info(`Announcement job ${job.id} completed`);
});
exports.announcementWorker.on('failed', (job, err) => {
    logger_1.logger.error(`Announcement job ${job?.id} failed:`, err);
});
