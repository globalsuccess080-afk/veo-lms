"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaths = void 0;
exports.adminPaths = {
    '/admin/stats': {
        get: {
            tags: ['Admin'],
            summary: 'Get platform statistics',
            description: 'Requires Admin Role.',
            responses: {
                '200': { description: 'Stats fetched successfully' },
                '403': { description: 'Forbidden - Requires Admin Role' },
            },
        },
    },
    '/admin/users': {
        get: {
            tags: ['Admin'],
            summary: 'Manage users',
            description: 'Requires Admin Role.',
            parameters: [
                { name: 'page', in: 'query', schema: { type: 'integer' } },
                { name: 'role', in: 'query', schema: { type: 'string' } },
            ],
            responses: {
                '200': { description: 'Users list fetched' },
            },
        },
    },
    '/admin/users/{id}': {
        put: {
            tags: ['Admin'],
            summary: 'Update user role/status',
            description: 'Requires Admin Role.',
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
                                role: { type: 'string' },
                                isActive: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
            responses: {
                '200': { description: 'User updated' },
            },
        },
    },
};
