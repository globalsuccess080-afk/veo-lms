"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUiOptions = exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const auth_swagger_1 = require("../docs/auth.swagger");
const user_swagger_1 = require("../docs/user.swagger");
const course_swagger_1 = require("../docs/course.swagger");
const lesson_swagger_1 = require("../docs/lesson.swagger");
const video_swagger_1 = require("../docs/video.swagger");
const payment_swagger_1 = require("../docs/payment.swagger");
const enrollment_swagger_1 = require("../docs/enrollment.swagger");
const progress_swagger_1 = require("../docs/progress.swagger");
const notification_swagger_1 = require("../docs/notification.swagger");
const admin_swagger_1 = require("../docs/admin.swagger");
const schemas_swagger_1 = require("../docs/schemas.swagger");
const swaggerDefinition = {
    openapi: '3.1.0',
    info: {
        title: 'VeoLMS Backend API',
        version: '1.0.0',
        description: 'Production-like Learning Management System REST API.',
        contact: {
            name: 'Bhupesh Kumar',
        },
        license: {
            name: 'MIT',
        },
    },
    servers: [
        {
            url: 'http://localhost:5000/api',
            description: 'Development Server',
        },
        {
            url: process.env.API_URL || 'https://your-domain/api',
            description: 'Production Server',
        }
    ],
    security: [
        {
            BearerAuth: [],
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: schemas_swagger_1.schemas,
    },
    tags: [
        { name: 'Authentication', description: 'User authentication and OTP' },
        { name: 'Users', description: 'User profile management' },
        { name: 'Courses', description: 'Course management and discovery' },
        { name: 'Lessons', description: 'Lesson content and structure' },
        { name: 'Videos', description: 'Video streaming and upload' },
        { name: 'Progress', description: 'User course progress tracking' },
        { name: 'Enrollment', description: 'Course enrollment' },
        { name: 'Payments', description: 'Payment processing via Razorpay' },
        { name: 'Notifications', description: 'System notifications' },
        { name: 'Admin', description: 'Administrative operations' },
        { name: 'Health', description: 'System health check' },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['Health'],
                summary: 'Check API health',
                security: [], // Public endpoint
                responses: {
                    '200': {
                        description: 'API is running',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ApiResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        ...auth_swagger_1.authPaths,
        ...user_swagger_1.userPaths,
        ...course_swagger_1.coursePaths,
        ...lesson_swagger_1.lessonPaths,
        ...video_swagger_1.videoPaths,
        ...payment_swagger_1.paymentPaths,
        ...enrollment_swagger_1.enrollmentPaths,
        ...progress_swagger_1.progressPaths,
        ...notification_swagger_1.notificationPaths,
        ...admin_swagger_1.adminPaths,
    },
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)({
    swaggerDefinition,
    apis: [], // We are explicitly importing the paths rather than relying on JSDoc comments in controllers
});
exports.swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
    },
};
