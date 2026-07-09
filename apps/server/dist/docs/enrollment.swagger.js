"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentPaths = void 0;
exports.enrollmentPaths = {
    '/enrollments': {
        get: {
            tags: ['Enrollment'],
            summary: 'Get user enrollments',
            description: 'Requires Authenticated Student.',
            responses: {
                '200': { description: 'Enrollments fetched successfully' },
            },
        },
    },
    '/enrollments/{courseId}/status': {
        get: {
            tags: ['Enrollment'],
            summary: 'Check if user is enrolled in a specific course',
            parameters: [
                { name: 'courseId', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
                '200': {
                    description: 'Enrollment status',
                    content: {
                        'application/json': {
                            example: { success: true, data: { isEnrolled: true } },
                        },
                    },
                },
            },
        },
    },
};
