"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../config/redis");
exports.announcementQueue = new bullmq_1.Queue('announcement', { connection: redis_1.redis });
