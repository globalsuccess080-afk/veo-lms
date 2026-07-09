"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateQueue = exports.importQueue = exports.exportQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
exports.exportQueue = new bullmq_1.Queue('export', { connection: redis_1.redis });
exports.importQueue = new bullmq_1.Queue('import', { connection: redis_1.redis });
exports.certificateQueue = new bullmq_1.Queue('certificate-generate', { connection: redis_1.redis });
