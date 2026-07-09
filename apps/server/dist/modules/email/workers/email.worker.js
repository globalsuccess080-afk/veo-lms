"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../../config/redis");
const email_service_1 = require("../email.service");
const logger_1 = require("../../../utils/logger");
exports.emailWorker = new bullmq_1.Worker('email', async (job) => {
    logger_1.logger.info('Processing email job', {
        jobId: job.id,
        queueName: job.queueName,
        to: job.data.to,
        subject: job.data.subject,
    });
    await (0, email_service_1.sendEmail)(job.data);
}, { connection: redis_1.redis });
logger_1.logger.info('Email worker initialized', {
    queueName: 'email',
    redis: (0, redis_1.getRedisConnectionInfo)(),
});
exports.emailWorker.on('ready', () => {
    logger_1.logger.info('Email worker ready', {
        queueName: 'email',
        redis: (0, redis_1.getRedisConnectionInfo)(),
    });
});
exports.emailWorker.on('active', (job) => {
    logger_1.logger.info('Email job active', {
        jobId: job.id,
        queueName: job.queueName,
        to: job.data.to,
        subject: job.data.subject,
    });
});
exports.emailWorker.on('completed', (job) => {
    logger_1.logger.info('Email job completed successfully', {
        jobId: job.id,
        queueName: job.queueName,
        to: job.data.to,
        subject: job.data.subject,
    });
});
exports.emailWorker.on('failed', (job, err) => {
    logger_1.logger.error('Email job failed', {
        jobId: job?.id,
        queueName: job?.queueName,
        to: job?.data?.to,
        subject: job?.data?.subject,
        error: err.message,
        stack: err.stack,
    });
});
exports.emailWorker.on('stalled', (jobId) => {
    logger_1.logger.warn('Email job stalled', {
        jobId,
        queueName: 'email',
    });
});
exports.emailWorker.on('error', (err) => {
    logger_1.logger.error('Email worker error', {
        queueName: 'email',
        error: err.message,
        stack: err.stack,
    });
});
