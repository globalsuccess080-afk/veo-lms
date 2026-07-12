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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminImportWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../../config/redis");
const logger_1 = require("../../../utils/logger");
const course_model_1 = require("../../course/course.model");
const user_model_1 = require("../../user/user.model");
const xlsx = __importStar(require("xlsx"));
const promises_1 = __importDefault(require("fs/promises"));
const crypto_1 = __importDefault(require("crypto"));
const password_1 = require("../../../utils/password");
exports.adminImportWorker = new bullmq_1.Worker('adminImport', async (job) => {
    logger_1.logger.info(`Processing admin import job ${job.id} for type: ${job.data.type}`);
    const { type, filePath } = job.data;
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        let imported = 0;
        let skipped = 0;
        if (type === 'courses') {
            // Filter valid rows
            const validRows = data.filter(row => row.title && row.slug);
            const skippedCountInitial = data.length - validRows.length;
            // Find existing slugs
            const slugs = validRows.map(r => r.slug);
            const existingCourses = await course_model_1.Course.find({ slug: { $in: slugs } }, { slug: 1 }).lean();
            const existingSlugs = new Set(existingCourses.map(c => c.slug));
            // Prepare new courses for batch insert
            const coursesToInsert = validRows
                .filter(row => !existingSlugs.has(row.slug))
                .map(row => ({
                title: row.title,
                slug: row.slug,
                description: row.description || '',
                shortDescription: row.shortDescription || '',
                price: row.price || 0,
                originalPrice: row.originalPrice || row.price || 0,
                category: row.category || 'General',
                level: row.level || 'beginner',
                isPublished: row.isPublished === 'true' || row.isPublished === true
            }));
            if (coursesToInsert.length > 0) {
                // Perform bulk insert
                await course_model_1.Course.insertMany(coursesToInsert, { ordered: false });
                imported = coursesToInsert.length;
            }
            skipped = skippedCountInitial + (validRows.length - imported);
        }
        else if (type === 'students') {
            const validRows = data.filter(row => row.email && row.name);
            const skippedCountInitial = data.length - validRows.length;
            // Pre-compute email hashes
            const rowsWithHash = validRows.map(row => ({
                ...row,
                hash: crypto_1.default.createHash('sha256').update(row.email.toLowerCase().trim()).digest('hex')
            }));
            // Find existing users
            const hashes = rowsWithHash.map(r => r.hash);
            const existingUsers = await user_model_1.User.find({ emailHash: { $in: hashes } }, { emailHash: 1 }).lean();
            const existingHashes = new Set(existingUsers.map(u => u.emailHash));
            // Hash passwords in parallel
            const usersToInsert = await Promise.all(rowsWithHash
                .filter(row => !existingHashes.has(row.hash))
                .map(async (row) => {
                const password = await (0, password_1.hashPassword)(row.password || 'TempPassword123!');
                return {
                    name: row.name,
                    email: row.email,
                    password,
                    role: 'student',
                    isActive: true
                };
            }));
            if (usersToInsert.length > 0) {
                await user_model_1.User.insertMany(usersToInsert, { ordered: false });
                imported = usersToInsert.length;
            }
            skipped = skippedCountInitial + (validRows.length - imported);
        }
        else {
            throw new Error('Unknown import type');
        }
        await promises_1.default.unlink(filePath).catch(() => { });
        return { imported, skipped, total: data.length };
    }
    catch (err) {
        await promises_1.default.unlink(filePath).catch(() => { });
        throw err;
    }
}, { connection: redis_1.redis });
exports.adminImportWorker.on('completed', (job) => {
    logger_1.logger.info(`Admin import job ${job.id} completed successfully. Imported: ${job.returnvalue.imported}, Skipped: ${job.returnvalue.skipped}`);
});
exports.adminImportWorker.on('failed', (job, err) => {
    logger_1.logger.error(`Admin import job ${job?.id} failed:`, err);
});
