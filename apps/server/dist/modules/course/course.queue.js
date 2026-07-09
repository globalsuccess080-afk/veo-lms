"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../config/redis");
exports.courseQueue = new bullmq_1.Queue('course', { connection: redis_1.redis });
