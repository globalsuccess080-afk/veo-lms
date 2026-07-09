"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.getUnreadCount = getUnreadCount;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
exports.dismiss = dismiss;
const notification_model_1 = require("./notification.model");
async function getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = {
        userId,
        $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }]
    };
    const [notifications, total] = await Promise.all([
        notification_model_1.Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        notification_model_1.Notification.countDocuments(query)
    ]);
    return {
        notifications: notifications.map(n => ({
            id: n._id.toString(),
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            targetUrl: n.targetUrl,
            actionLabel: n.actionLabel,
            actionUrl: n.actionUrl,
            priority: n.priority,
            announcementId: n.announcementId?.toString(),
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString()
        })),
        total,
        page,
        limit
    };
}
async function getUnreadCount(userId) {
    const count = await notification_model_1.Notification.countDocuments({
        userId,
        isRead: false,
        $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }]
    });
    return { unread: count };
}
async function markRead(userId, id) {
    await notification_model_1.Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true });
}
async function markAllRead(userId) {
    await notification_model_1.Notification.updateMany({ userId, isRead: false }, { isRead: true });
}
async function dismiss(userId, id) {
    await notification_model_1.Notification.findOneAndDelete({ _id: id, userId });
}
