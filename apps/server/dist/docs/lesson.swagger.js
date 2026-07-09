"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonPaths = void 0;
exports.lessonPaths = {
    '/lessons': {
        post: {
            tags: ['Lessons'],
            summary: 'Create a new lesson (Admin/Instructor)',
            description: 'Requires Admin or Instructor Role.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                courseId: { type: 'string' },
                                title: { type: 'string' },
                                description: { type: 'string' },
                                isFree: { type: 'boolean' },
                            },
                        },
                        example: { courseId: '60d0fe4f5311236168a109ca', title: 'Introduction', description: 'Intro lesson', isFree: true },
                    },
                },
            },
            responses: {
                '201': { description: 'Lesson created successfully' },
                '400': { description: 'Validation failed' },
            },
        },
    },
    '/lessons/{id}': {
        get: {
            tags: ['Lessons'],
            summary: 'Get lesson details',
            description: 'Requires Enrollment unless isFree is true.',
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
                '200': { description: 'Lesson fetched successfully' },
                '403': { description: 'Not enrolled in the course' },
            },
        },
        put: {
            tags: ['Lessons'],
            summary: 'Update lesson (Admin/Instructor)',
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                isFree: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
            responses: {
                '200': { description: 'Lesson updated successfully' },
            },
        },
        delete: {
            tags: ['Lessons'],
            summary: 'Delete lesson (Admin/Instructor)',
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
                '200': { description: 'Lesson deleted successfully' },
            },
        },
    },
};
