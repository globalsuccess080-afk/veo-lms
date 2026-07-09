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
exports.setupSocket = setupSocket;
const socket_io_1 = require("socket.io");
const generateToken_1 = require("../utils/generateToken");
const security_1 = require("./security");
function setupSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: security_1.allowedFrontendOrigins, credentials: true }
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error('Auth required'));
        try {
            const user = (0, generateToken_1.verifyAccessToken)(token);
            socket.data.user = user;
            socket.join(`user:${user.id}`);
            if (user.role === 'admin')
                socket.join('role:admin');
            if (user.role === 'student')
                socket.join('role:student');
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        socket.on('mark_read', async (data) => {
            try {
                const { markRead, getUnreadCount } = await Promise.resolve().then(() => __importStar(require('../modules/notification/notification.service')));
                await markRead(socket.data.user.id, data.notificationId);
                const { unread } = await getUnreadCount(socket.data.user.id);
                socket.emit('notification:read', { id: data.notificationId });
                socket.emit('notification:unread_count', { unread });
            }
            catch (err) {
                console.error('Socket mark_read error:', err);
            }
        });
    });
    return io;
}
