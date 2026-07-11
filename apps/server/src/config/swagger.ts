import swaggerJSDoc from 'swagger-jsdoc'
import { authPaths } from '../docs/auth.swagger'
import { userPaths } from '../docs/user.swagger'
import { coursePaths } from '../docs/course.swagger'
import { lessonPaths } from '../docs/lesson.swagger'
import { videoPaths } from '../docs/video.swagger'
import { paymentPaths } from '../docs/payment.swagger'
import { enrollmentPaths } from '../docs/enrollment.swagger'
import { progressPaths } from '../docs/progress.swagger'
import { notificationPaths } from '../docs/notification.swagger'
import { adminPaths } from '../docs/admin.swagger'
import { schemas } from '../docs/schemas.swagger'

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
      url: process.env.API_URL || 'https://api.veo-lms.bhupeshb7.me/api',
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
    schemas,
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
    ...authPaths,
    ...userPaths,
    ...coursePaths,
    ...lessonPaths,
    ...videoPaths,
    ...paymentPaths,
    ...enrollmentPaths,
    ...progressPaths,
    ...notificationPaths,
    ...adminPaths,
  },
}

export const swaggerSpec = swaggerJSDoc({
  swaggerDefinition,
  apis: [], // We are explicitly importing the paths rather than relying on JSDoc comments in controllers
})

export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}
