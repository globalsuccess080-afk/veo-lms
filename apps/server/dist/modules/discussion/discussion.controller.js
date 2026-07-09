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
exports.remove = exports.create = exports.byLesson = void 0;
const zod_1 = require("zod");
const discussionService = __importStar(require("./discussion.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const params_1 = require("../../utils/params");
const createSchema = zod_1.z.object({
    courseId: zod_1.z.string().min(1),
    lessonId: zod_1.z.string().min(1),
    parentId: zod_1.z.string().optional(),
    message: zod_1.z.string().min(1).max(2000)
});
exports.byLesson = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await discussionService.listByLesson((0, params_1.param)(req.params.lessonId));
        (0, apiResponse_1.sendSuccess)(res, data);
    })
];
exports.create = [
    auth_middleware_1.authenticate,
    (0, validate_middleware_1.validate)(createSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await discussionService.createMessage(req.user.id, req.body);
        (0, apiResponse_1.sendSuccess)(res, data, 'Message posted', 201);
    })
];
exports.remove = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await discussionService.deleteMessage(req.user.id, req.user.role, (0, params_1.param)(req.params.id));
        (0, apiResponse_1.sendSuccess)(res, null, 'Message deleted');
    })
];
