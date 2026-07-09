"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authPaths = void 0;
exports.authPaths = {
    '/auth/send-otp': {
        post: {
            tags: ['Authentication'],
            summary: 'Send OTP for registration',
            security: [], // Public endpoint
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name', 'email'],
                            properties: {
                                name: { type: 'string', minLength: 1 },
                                email: { type: 'string', format: 'email' },
                            },
                        },
                        example: { name: 'John Doe', email: 'student@example.com' },
                    },
                },
            },
            responses: {
                '200': { description: 'OTP sent successfully' },
                '400': { description: 'Bad request' },
            },
        },
    },
    '/auth/register': {
        post: {
            tags: ['Authentication'],
            summary: 'Register new user',
            security: [], // Public endpoint
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                email: { type: 'string', format: 'email' },
                                password: { type: 'string' },
                                otp: { type: 'string' },
                            },
                        },
                        example: { name: 'John Doe', email: 'john@example.com', password: 'password123', otp: '123456' },
                    },
                },
            },
            responses: {
                '201': { description: 'User registered successfully' },
                '400': { description: 'Validation error' },
            },
        },
    },
    '/auth/login': {
        post: {
            tags: ['Authentication'],
            summary: 'User login',
            security: [], // Public endpoint
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: { type: 'string', format: 'email' },
                                password: { type: 'string' },
                            },
                        },
                        example: { email: 'student@example.com', password: 'password123' },
                    },
                },
            },
            responses: {
                '200': { description: 'Login successful' },
                '401': { description: 'Invalid credentials' },
            },
        },
    },
    '/auth/admin/login': {
        post: {
            tags: ['Authentication'],
            summary: 'Admin login',
            security: [], // Public endpoint
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: { type: 'string', format: 'email' },
                                password: { type: 'string' },
                            },
                        },
                        example: { email: 'admin@example.com', password: 'password123' },
                    },
                },
            },
            responses: {
                '200': { description: 'Admin login successful' },
                '401': { description: 'Invalid credentials or access denied' },
            },
        },
    },
    '/auth/refresh': {
        post: {
            tags: ['Authentication'],
            summary: 'Refresh access token',
            responses: {
                '200': { description: 'Token refreshed successfully' },
                '401': { description: 'Invalid refresh token' },
            },
        },
    },
    '/auth/logout': {
        post: {
            tags: ['Authentication'],
            summary: 'Logout user',
            responses: {
                '200': { description: 'Logout successful' },
            },
        },
    },
    '/auth/me': {
        get: {
            tags: ['Authentication'],
            summary: 'Get current user profile',
            responses: {
                '200': { description: 'User profile fetched' },
                '401': { description: 'Unauthorized' },
            },
        },
    },
};
