"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressPaths = void 0;
exports.progressPaths = {
    '/progress/{courseId}': {
        get: {
            tags: ['Progress'],
            summary: 'Get user progress for a course',
            description: 'Requires Authenticated Student.',
            parameters: [
                { name: 'courseId', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
                '200': { description: 'Progress fetched successfully' },
                '404': { description: 'Progress not found' },
            },
        },
    },
    '/progress/{courseId}/lessons/{lessonId}': {
        put: {
            tags: ['Progress'],
            summary: 'Update lesson progress',
            description: 'Requires Authenticated Student.',
            parameters: [
                { name: 'courseId', in: 'path', required: true, schema: { type: 'string' } },
                { name: 'lessonId', in: 'path', required: true, schema: { type: 'string' } },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                completed: { type: 'boolean' },
                            },
                        },
                        example: { completed: true },
                    },
                },
            },
            responses: {
                '200': { description: 'Progress updated successfully' },
            },
        },
    },
};
