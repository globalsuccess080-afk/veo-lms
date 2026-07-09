"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listByLesson = listByLesson;
exports.createMessage = createMessage;
exports.deleteMessage = deleteMessage;
const discussion_model_1 = require("./discussion.model");
const apiError_1 = require("../../utils/apiError");
const assetPath_1 = require("../../utils/assetPath");
async function listByLesson(lessonId) {
    const items = await discussion_model_1.Discussion.find({ lessonId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name avatar role')
        .lean();
    return items.map((d) => ({
        id: d._id.toString(),
        parentId: d.parentId?.toString() || null,
        message: d.message,
        createdAt: d.createdAt.toISOString(),
        author: {
            id: d.userId?._id?.toString() || '',
            name: d.userId?.name || 'User',
            avatar: d.userId?.avatar ? (0, assetPath_1.formatAssetPath)(d.userId.avatar) : null,
            role: d.userId?.role || 'student'
        }
    }));
}
async function createMessage(userId, data) {
    const created = await discussion_model_1.Discussion.create({ userId, ...data });
    const populated = await discussion_model_1.Discussion.findById(created._id)
        .populate('userId', 'name avatar role')
        .lean();
    return {
        id: populated._id.toString(),
        parentId: populated.parentId?.toString() || null,
        message: populated.message,
        createdAt: populated.createdAt.toISOString(),
        author: {
            id: populated.userId?._id?.toString() || '',
            name: populated.userId?.name || 'User',
            avatar: populated.userId?.avatar ? (0, assetPath_1.formatAssetPath)(populated.userId.avatar) : null,
            role: populated.userId?.role || 'student'
        }
    };
}
async function deleteMessage(userId, role, messageId) {
    const msg = await discussion_model_1.Discussion.findById(messageId);
    if (!msg)
        throw new apiError_1.ApiError(404, 'Message not found');
    if (msg.userId.toString() !== userId && role !== 'admin')
        throw new apiError_1.ApiError(403, 'Unauthorized');
    await msg.deleteOne();
    await discussion_model_1.Discussion.deleteMany({ parentId: messageId }); // cascade delete direct replies
}
