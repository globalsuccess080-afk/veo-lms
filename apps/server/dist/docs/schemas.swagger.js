"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = void 0;
exports.schemas = {
    ApiResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            meta: { type: 'object', nullable: true },
        },
    },
    ErrorResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
        },
    },
    User: {
        type: 'object',
        properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['student', 'admin', 'instructor'] },
            avatar: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
        },
    },
    Course: {
        type: 'object',
        properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            thumbnail: { type: 'string' },
            instructor: { $ref: '#/components/schemas/User' },
            isPublished: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
        },
    },
    Lesson: {
        type: 'object',
        properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            courseId: { type: 'string' },
            description: { type: 'string' },
            videoUrl: { type: 'string' },
            duration: { type: 'number' },
            isFree: { type: 'boolean' },
            order: { type: 'number' },
        },
    },
    Enrollment: {
        type: 'object',
        properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            course: { type: 'string' },
            status: { type: 'string', enum: ['active', 'completed', 'cancelled'] },
            enrolledAt: { type: 'string', format: 'date-time' },
        },
    },
    Payment: {
        type: 'object',
        properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            course: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'successful', 'failed'] },
            razorpayOrderId: { type: 'string' },
            razorpayPaymentId: { type: 'string' },
        },
    },
    Progress: {
        type: 'object',
        properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            course: { type: 'string' },
            completedLessons: {
                type: 'array',
                items: { type: 'string' },
            },
            completionPercentage: { type: 'number' },
        },
    },
    Notification: {
        type: 'object',
        properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
        },
    },
    Pagination: {
        type: 'object',
        properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            totalDocs: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPrevPage: { type: 'boolean' },
        },
    },
};
