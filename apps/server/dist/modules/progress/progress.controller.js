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
exports.byLesson = exports.studentDashboard = exports.recent = exports.byCourse = exports.update = void 0;
const shared_1 = require("@veolms/shared");
const progressService = __importStar(require("./progress.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const params_1 = require("../../utils/params");
exports.update = [
    auth_middleware_1.authenticate,
    (0, validate_middleware_1.validate)(shared_1.updateProgressSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { courseId, lessonId, watchedSeconds, totalSeconds, isCompleted } = req.body;
        const result = await progressService.updateProgress(req.user.id, courseId, lessonId, watchedSeconds, totalSeconds, isCompleted);
        (0, apiResponse_1.sendSuccess)(res, result);
    })
];
exports.byCourse = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await progressService.getCourseProgress(req.user.id, (0, params_1.param)(req.params.courseId));
        (0, apiResponse_1.sendSuccess)(res, data);
    })
];
exports.recent = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await progressService.getRecent(req.user.id);
        (0, apiResponse_1.sendSuccess)(res, data);
    })
];
exports.studentDashboard = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await progressService.getStudentDashboard(req.user.id);
        (0, apiResponse_1.sendSuccess)(res, data);
    })
];
exports.byLesson = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await progressService.getLessonProgress(req.user.id, (0, params_1.param)(req.params.lessonId));
        (0, apiResponse_1.sendSuccess)(res, data);
    })
];
