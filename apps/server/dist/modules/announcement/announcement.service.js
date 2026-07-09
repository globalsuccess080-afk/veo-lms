"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnnouncement = createAnnouncement;
exports.listAnnouncements = listAnnouncements;
exports.getAnnouncement = getAnnouncement;
exports.deleteAnnouncement = deleteAnnouncement;
exports.duplicateAnnouncement = duplicateAnnouncement;
const announcement_model_1 = require("./announcement.model");
const announcement_queue_1 = require("./announcement.queue");
const apiError_1 = require("../../utils/apiError");
const notification_model_1 = require("../notification/notification.model");
const queryBuilder_1 = require("../../utils/queryBuilder");
async function createAnnouncement(data, userId) {
    const announcement = await announcement_model_1.Announcement.create({
        ...data,
        createdBy: userId,
        status: data.scheduledAt && new Date(data.scheduledAt) > new Date() ? 'scheduled' : 'draft'
    });
    if (announcement.status === 'scheduled') {
        const delay = new Date(announcement.scheduledAt).getTime() - Date.now();
        await announcement_queue_1.announcementQueue.add('send-announcement', { announcementId: announcement._id }, { delay });
    }
    else if (!data.scheduledAt) {
        // If no schedule provided, send immediately
        announcement.status = 'scheduled';
        await announcement.save();
        await announcement_queue_1.announcementQueue.add('send-announcement', { announcementId: announcement._id });
    }
    return announcement;
}
async function listAnnouncements(query) {
    const { filterQuery, skip, limit, sort, page } = (0, queryBuilder_1.buildQuery)({ ...query, isDeleted: false }, ['title', 'message']);
    const announcements = await announcement_model_1.Announcement.find(filterQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
    const total = await announcement_model_1.Announcement.countDocuments(filterQuery);
    // Compute open rates dynamically
    const announcementIds = announcements.map(a => a._id);
    const stats = await notification_model_1.Notification.aggregate([
        { $match: { announcementId: { $in: announcementIds } } },
        { $group: {
                _id: '$announcementId',
                sentTo: { $sum: 1 },
                opened: { $sum: { $cond: ['$isRead', 1, 0] } }
            }
        }
    ]);
    const statsMap = stats.reduce((acc, stat) => {
        acc[stat._id.toString()] = { sentTo: stat.sentTo, opened: stat.opened };
        return acc;
    }, {});
    return {
        announcements: announcements.map(a => ({
            ...a,
            id: a._id.toString(),
            stats: statsMap[a._id.toString()] || { sentTo: 0, opened: 0 }
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}
async function getAnnouncement(id) {
    const announcement = await announcement_model_1.Announcement.findById(id).lean();
    if (!announcement || announcement.isDeleted)
        throw new apiError_1.ApiError(404, 'Announcement not found');
    return announcement;
}
async function deleteAnnouncement(id) {
    const announcement = await announcement_model_1.Announcement.findById(id);
    if (!announcement || announcement.isDeleted)
        throw new apiError_1.ApiError(404, 'Announcement not found');
    announcement.isDeleted = true;
    announcement.deletedAt = new Date();
    await announcement.save();
    return { success: true };
}
async function duplicateAnnouncement(id, userId) {
    const original = await announcement_model_1.Announcement.findById(id).lean();
    if (!original || original.isDeleted)
        throw new apiError_1.ApiError(404, 'Announcement not found');
    const { _id, createdAt, updatedAt, scheduledAt, status, ...rest } = original;
    const announcement = await announcement_model_1.Announcement.create({
        ...rest,
        title: `${original.title} (Copy)`,
        createdBy: userId,
        status: 'draft',
        scheduledAt: null
    });
    return announcement;
}
