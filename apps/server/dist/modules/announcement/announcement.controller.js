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
exports.remove = exports.duplicate = exports.getOne = exports.list = exports.create = void 0;
const announcementService = __importStar(require("./announcement.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const zod_1 = require("zod");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const params_1 = require("../../utils/params");
const createAnnouncementSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    audience: zod_1.z.object({
        type: zod_1.z.enum(['all', 'course']),
        courseId: zod_1.z.string().optional()
    }),
    type: zod_1.z.enum(['General', 'Course Update', 'New Lesson', 'Assignment', 'Offer', 'Maintenance', 'Important']).default('General'),
    deliveryChannels: zod_1.z.object({
        inApp: zod_1.z.boolean().default(true),
        email: zod_1.z.boolean().default(false)
    }),
    priority: zod_1.z.enum(['Low', 'Normal', 'High', 'Urgent']).default('Normal'),
    targetUrl: zod_1.z.string().optional(),
    actionLabel: zod_1.z.string().optional(),
    actionUrl: zod_1.z.string().optional(),
    bannerImage: zod_1.z.string().optional(),
    scheduledAt: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().optional()
});
exports.create = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, validate_middleware_1.validate)(createAnnouncementSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await announcementService.createAnnouncement(req.body, req.user.id);
        (0, apiResponse_1.sendSuccess)(res, data, 'Announcement created');
    })
];
exports.list = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await announcementService.listAnnouncements(req.query);
        (0, apiResponse_1.sendSuccess)(res, data, 'Announcements retrieved');
    })
];
exports.getOne = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await announcementService.getAnnouncement((0, params_1.param)(req.params.id));
        (0, apiResponse_1.sendSuccess)(res, data);
    })
];
exports.duplicate = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await announcementService.duplicateAnnouncement((0, params_1.param)(req.params.id), req.user.id);
        (0, apiResponse_1.sendSuccess)(res, data, 'Announcement duplicated');
    })
];
exports.remove = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await announcementService.deleteAnnouncement((0, params_1.param)(req.params.id));
        (0, apiResponse_1.sendSuccess)(res, null, 'Announcement deleted');
    })
];
