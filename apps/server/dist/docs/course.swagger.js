"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coursePaths = void 0;
exports.coursePaths = {
    '/courses': {
        get: {
            tags: ['Courses'],
            summary: 'Get all published courses (Public)',
            security: [],
            parameters: [
                { name: 'page', in: 'query', schema: { type: 'integer' } },
                { name: 'limit', in: 'query', schema: { type: 'integer' } },
                { name: 'category', in: 'query', schema: { type: 'string' } },
            ],
            responses: {
                '200': { description: 'Courses fetched successfully' },
            },
        },
        post: {
            tags: ['Courses'],
            summary: 'Create a new course (Admin/Instructor)',
            description: 'Requires Admin or Instructor Role.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                price: { type: 'number' },
                            },
                        },
                        example: { title: 'Advanced React', description: 'Learn React deeply', price: 99.99 },
                    },
                },
            },
            responses: {
                '201': { description: 'Course created successfully' },
            },
        },
    },
    '/courses/{slug}': {
        get: {
            tags: ['Courses'],
            summary: 'Get course details by slug (Public)',
            security: [],
            parameters: [
                { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
                '200': { description: 'Course fetched successfully' },
                '404': { description: 'Course not found' },
            },
        },
    },
    '/courses/{id}': {
        put: {
            tags: ['Courses'],
            summary: 'Update a course (Admin/Instructor)',
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
                                price: { type: 'number' },
                                isPublished: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
            responses: {
                '200': { description: 'Course updated successfully' },
            },
        },
        delete: {
            tags: ['Courses'],
            summary: 'Delete a course (Admin)',
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
                '200': { description: 'Course deleted successfully' },
            },
        },
    },
};
