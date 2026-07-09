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
exports.getJobStatus = exports.importStudents = exports.importCourses = exports.exportEnrollments = exports.exportStudents = exports.exportCourses = exports.enrollments = exports.toggleStudent = exports.students = exports.stats = void 0;
const adminService = __importStar(require("./admin.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const params_1 = require("../../utils/params");
const apiError_1 = require("../../utils/apiError");
exports.stats = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await adminService.getStats();
        (0, apiResponse_1.sendSuccess)(res, data);
    })
];
exports.students = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await adminService.getStudents(req.query);
        (0, apiResponse_1.sendSuccess)(res, result.students, 'Success', 200, {
            page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages
        });
    })
];
exports.toggleStudent = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await adminService.toggleStudent((0, params_1.param)(req.params.id), req.body.isActive);
        (0, apiResponse_1.sendSuccess)(res, result);
    })
];
exports.enrollments = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await adminService.getAllEnrollments(req.query);
        (0, apiResponse_1.sendSuccess)(res, result.enrollments, 'Success', 200, {
            page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages
        });
    })
];
exports.exportCourses = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await adminService.queueExport('courses');
        (0, apiResponse_1.sendSuccess)(res, data, 'Export queued successfully');
    })
];
exports.exportStudents = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await adminService.queueExport('students');
        (0, apiResponse_1.sendSuccess)(res, data, 'Export queued successfully');
    })
];
exports.exportEnrollments = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await adminService.queueExport('enrollments');
        (0, apiResponse_1.sendSuccess)(res, data, 'Export queued successfully');
    })
];
exports.importCourses = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file)
        throw new apiError_1.ApiError(400, 'No file uploaded');
    const result = await adminService.queueImport('courses', req.file.path);
    (0, apiResponse_1.sendSuccess)(res, result, 'Courses import queued successfully');
});
exports.importStudents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file)
        throw new apiError_1.ApiError(400, 'No file uploaded');
    const result = await adminService.queueImport('students', req.file.path);
    (0, apiResponse_1.sendSuccess)(res, result, 'Students import queued successfully');
});
exports.getJobStatus = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await adminService.getJobStatus(String(req.params.id));
        (0, apiResponse_1.sendSuccess)(res, result);
    })
];
