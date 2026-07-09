"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TYPES = exports.PAYMENT_STATUSES = exports.VIDEO_QUALITIES = exports.VIDEO_STATUSES = exports.COURSE_LEVELS = exports.USER_ROLES = void 0;
exports.USER_ROLES = ['student', 'admin'];
exports.COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'];
exports.VIDEO_STATUSES = ['pending', 'uploading', 'queued', 'processing', 'uploading-storage', 'ready', 'failed'];
exports.VIDEO_QUALITIES = ['360p', '480p', '720p', '1080p'];
exports.PAYMENT_STATUSES = ['created', 'paid', 'failed', 'refunded'];
exports.NOTIFICATION_TYPES = [
    'announcement',
    'enrollment',
    'course_update',
    'payment',
    'system'
];
