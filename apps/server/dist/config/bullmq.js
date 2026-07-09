"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoUploadQueue = exports.videoQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
exports.videoQueue = new bullmq_1.Queue('video-transcode', {
    connection: redis_1.redis,
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 100,
        removeOnFail: false
    }
});
exports.videoUploadQueue = new bullmq_1.Queue('video-upload', {
    connection: redis_1.redis,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: false,
    },
});
