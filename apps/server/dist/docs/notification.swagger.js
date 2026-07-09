"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationPaths = void 0;
exports.notificationPaths = {
    '/notifications': {
        get: {
            tags: ['Notifications'],
            summary: 'Get user notifications',
            parameters: [
                { name: 'page', in: 'query', schema: { type: 'integer' } },
                { name: 'limit', in: 'query', schema: { type: 'integer' } },
            ],
            responses: {
                '200': { description: 'Notifications fetched successfully' },
            },
        },
    },
    '/notifications/{id}/read': {
        patch: {
            tags: ['Notifications'],
            summary: 'Mark notification as read',
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
                '200': { description: 'Notification marked as read' },
            },
        },
    },
    '/notifications/read-all': {
        post: {
            tags: ['Notifications'],
            summary: 'Mark all notifications as read',
            responses: {
                '200': { description: 'All notifications marked as read' },
            },
        },
    },
};
