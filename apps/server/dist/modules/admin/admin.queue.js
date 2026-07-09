"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminImportQueue = exports.adminExportQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../config/redis");
exports.adminExportQueue = new bullmq_1.Queue('adminExport', { connection: redis_1.redis });
exports.adminImportQueue = new bullmq_1.Queue('adminImport', { connection: redis_1.redis });
