"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/ffmpeg");
const db_1 = require("./config/db");
const redis_1 = require("./config/redis");
const logger_1 = require("./utils/logger");
require("./modules/email/workers/email.worker");
require("./modules/announcement/workers/announcement.worker");
require("./modules/admin/workers/export.worker");
require("./modules/admin/workers/import.worker");
require("./modules/course/workers/course.worker");
require("./modules/certificate/workers/certificate.worker");
require("./modules/certificate/workers/pdf.worker");
require("./modules/video/workers/transcode.worker");
require("./modules/video/workers/upload.worker");
const WORKER_HEARTBEAT_KEY = 'health:worker:main';
const WORKER_HEARTBEAT_TTL_SECONDS = 90;
const WORKER_HEARTBEAT_INTERVAL_MS = 30000;
let heartbeatTimer = null;
async function publishHeartbeat() {
    await redis_1.redis.set(WORKER_HEARTBEAT_KEY, JSON.stringify({
        pid: process.pid,
        updatedAt: new Date().toISOString(),
    }), 'EX', WORKER_HEARTBEAT_TTL_SECONDS);
}
async function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
    await redis_1.redis.del(WORKER_HEARTBEAT_KEY);
}
async function start() {
    await (0, db_1.connectDB)();
    await publishHeartbeat();
    heartbeatTimer = setInterval(() => {
        publishHeartbeat().catch((err) => {
            logger_1.logger.error('Failed to publish worker heartbeat', { error: err.message });
        });
    }, WORKER_HEARTBEAT_INTERVAL_MS);
    logger_1.logger.info('Workers started successfully');
}
process.on('SIGINT', () => {
    stopHeartbeat().finally(() => process.exit(0));
});
process.on('SIGTERM', () => {
    stopHeartbeat().finally(() => process.exit(0));
});
start().catch((err) => {
    logger_1.logger.error('Failed to start worker process', { error: err.message });
    process.exit(1);
});
