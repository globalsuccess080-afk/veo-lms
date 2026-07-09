"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../config/redis");
exports.certificateQueue = new bullmq_1.Queue('certificate-generate', {
    connection: redis_1.redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
    },
});
