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
exports.videoUrl = exports.byCourse = exports.remove = exports.update = exports.create = exports.getById = void 0;
const shared_1 = require("@veolms/shared");
const lessonService = __importStar(require("./lesson.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const params_1 = require("../../utils/params");
exports.getById = [
    auth_middleware_1.optionalAuth,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const lesson = await lessonService.getLesson((0, params_1.param)(req.params.id), req.user?.id, req.user?.role);
        (0, apiResponse_1.sendSuccess)(res, lesson);
    })
];
exports.create = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, validate_middleware_1.validate)(shared_1.createLessonSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const lesson = await lessonService.createLesson((0, params_1.param)(req.params.courseId), (0, params_1.param)(req.params.sectionId), req.body);
        (0, apiResponse_1.sendSuccess)(res, lesson, 'Lesson created', 201);
    })
];
exports.update = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, validate_middleware_1.validate)(shared_1.updateLessonSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const lesson = await lessonService.updateLesson((0, params_1.param)(req.params.id), req.body);
        (0, apiResponse_1.sendSuccess)(res, lesson, 'Lesson updated');
    })
];
exports.remove = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await lessonService.deleteLesson((0, params_1.param)(req.params.id));
        (0, apiResponse_1.sendSuccess)(res, null, 'Lesson deleted');
    })
];
exports.byCourse = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const lessons = await lessonService.getLessonsByCourse((0, params_1.param)(req.params.courseId));
        (0, apiResponse_1.sendSuccess)(res, lessons);
    })
];
exports.videoUrl = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const url = await lessonService.getVideoUrl((0, params_1.param)(req.params.id), req.user.id, req.user.role);
        (0, apiResponse_1.sendSuccess)(res, url);
    })
];
