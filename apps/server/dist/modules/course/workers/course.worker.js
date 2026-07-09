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
exports.courseWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../../config/redis");
const course_model_1 = require("../course.model");
const lesson_model_1 = require("../../lesson/lesson.model");
const cache_1 = require("../../../utils/cache");
const logger_1 = require("../../../utils/logger");
exports.courseWorker = new bullmq_1.Worker('course', async (job) => {
    const { action, ids } = job.data;
    if (action === 'bulk_delete' && Array.isArray(ids)) {
        logger_1.logger.info(`Processing bulk delete for ${ids.length} courses. Job ID: ${job.id}`);
        try {
            const courses = await course_model_1.Course.find({ _id: { $in: ids } });
            if (courses.length > 0) {
                await course_model_1.Course.deleteMany({ _id: { $in: ids } });
                await lesson_model_1.Lesson.deleteMany({ courseId: { $in: ids } });
                await cache_1.cache.del('courses:featured');
                await cache_1.cache.delPattern('courses:list:*');
                // invalidate specific course slugs
                for (const course of courses) {
                    await cache_1.cache.del(`courses:slug:${course.slug}`);
                }
                logger_1.logger.info(`Successfully deleted ${courses.length} courses in batch operation.`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error processing bulk delete job ${job.id}:`, error);
            throw error;
        }
    }
    else if (action === 'notify_update' && job.data.courseId) {
        try {
            const course = await course_model_1.Course.findById(job.data.courseId);
            if (!course)
                return;
            const { Enrollment } = await Promise.resolve().then(() => __importStar(require('../../enrollment/enrollment.model')));
            const { User } = await Promise.resolve().then(() => __importStar(require('../../user/user.model')));
            const { emailQueue } = await Promise.resolve().then(() => __importStar(require('../../email/email.queue')));
            const { generateCourseUpdateEmail } = await Promise.resolve().then(() => __importStar(require('../../email/templates')));
            const enrollments = await Enrollment.find({ courseId: course._id, isActive: true }).select('userId').lean();
            if (!enrollments.length)
                return;
            const userIds = enrollments.map(e => e.userId);
            const users = await User.find({ _id: { $in: userIds }, isActive: true }).select('email').lean();
            const message = job.data.message || `The course "${course.title}" has been updated.`;
            const htmlContent = generateCourseUpdateEmail(course.title, message);
            for (const user of users) {
                await emailQueue.add('sendEmail', {
                    to: user.email,
                    subject: `Course Update: ${course.title}`,
                    html: htmlContent
                });
            }
            logger_1.logger.info(`Queued update emails for ${users.length} students of course ${course._id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error processing notify_update job ${job.id}:`, error);
            throw error;
        }
    }
}, { connection: redis_1.redis });
exports.courseWorker.on('completed', (job) => {
    logger_1.logger.info(`Course job ${job.id} completed`);
});
exports.courseWorker.on('failed', (job, err) => {
    logger_1.logger.error(`Course job ${job?.id} failed with error: ${err.message}`);
});
