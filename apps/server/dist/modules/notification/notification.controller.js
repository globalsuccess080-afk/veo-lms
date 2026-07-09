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
exports.dismiss = exports.markAllRead = exports.markRead = exports.unreadCount = exports.list = void 0;
const notificationService = __importStar(require("./notification.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const params_1 = require("../../utils/params");
exports.list = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const result = await notificationService.getNotifications(req.user.id, page);
        (0, apiResponse_1.sendSuccess)(res, result.notifications, 'Success', 200, {
            page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit)
        });
    })
];
exports.unreadCount = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = await notificationService.getUnreadCount(req.user.id);
        (0, apiResponse_1.sendSuccess)(res, data);
    })
];
exports.markRead = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await notificationService.markRead(req.user.id, (0, params_1.param)(req.params.id));
        const { unread } = await notificationService.getUnreadCount(req.user.id);
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${req.user.id}`).emit('notification:read', { id: (0, params_1.param)(req.params.id) });
            io.to(`user:${req.user.id}`).emit('notification:unread_count', { unread });
        }
        (0, apiResponse_1.sendSuccess)(res, null, 'Marked as read');
    })
];
exports.markAllRead = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await notificationService.markAllRead(req.user.id);
        const io = req.app.get('io');
        if (io)
            io.to(`user:${req.user.id}`).emit('notification:unread_count', { unread: 0 });
        (0, apiResponse_1.sendSuccess)(res, null, 'All marked as read');
    })
];
exports.dismiss = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await notificationService.dismiss(req.user.id, (0, params_1.param)(req.params.id));
        const { unread } = await notificationService.getUnreadCount(req.user.id);
        const io = req.app.get('io');
        if (io)
            io.to(`user:${req.user.id}`).emit('notification:unread_count', { unread });
        (0, apiResponse_1.sendSuccess)(res, null, 'Dismissed');
    })
];
