"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementSchema = exports.updateProgressSchema = exports.paymentStatusParamsSchema = exports.createOrderSchema = exports.updateLessonSchema = exports.createLessonSchema = exports.createSectionSchema = exports.updateCourseSchema = exports.createCourseSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Enter your full name').max(100, 'Name is too long'),
    email: zod_1.z.string().email('Enter a valid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
    otp: zod_1.z.string().length(6, 'OTP must be 6 digits')
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Enter a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Enter a valid email address')
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Enter a valid email address'),
    otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long')
});
exports.createCourseSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().min(10),
    shortDescription: zod_1.z.string().min(10).max(300),
    thumbnail: zod_1.z.string().optional(),
    trailerUrl: zod_1.z.string().optional(),
    instructor: zod_1.z.object({
        name: zod_1.z.string().min(2),
        bio: zod_1.z.string().optional().default(''),
        avatar: zod_1.z.string().optional().default('')
    }),
    price: zod_1.z.number().min(0),
    originalPrice: zod_1.z.number().min(0).optional(),
    category: zod_1.z.string().min(2),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
    level: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    language: zod_1.z.string().default('English'),
    isFeatured: zod_1.z.boolean().optional().default(false),
    isPublished: zod_1.z.boolean().optional().default(false)
});
exports.updateCourseSchema = exports.createCourseSchema.partial();
exports.createSectionSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200),
    order: zod_1.z.number().int().min(0)
});
exports.createLessonSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().optional().default(''),
    order: zod_1.z.number().int().min(0),
    duration: zod_1.z.number().int().min(0).default(0),
    isPreview: zod_1.z.boolean().optional().default(false),
    youtubeUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    fileUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    resources: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        url: zod_1.z.string(),
        type: zod_1.z.string().optional(),
        size: zod_1.z.number().optional()
    })).optional().default([])
});
exports.updateLessonSchema = exports.createLessonSchema.partial();
exports.createOrderSchema = zod_1.z.object({
    courseId: zod_1.z.string().min(1),
    couponCode: zod_1.z.string().optional()
});
exports.paymentStatusParamsSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1)
});
exports.updateProgressSchema = zod_1.z.object({
    courseId: zod_1.z.string(),
    lessonId: zod_1.z.string(),
    watchedSeconds: zod_1.z.number().min(0),
    totalSeconds: zod_1.z.number().min(0),
    isCompleted: zod_1.z.boolean().optional()
});
exports.announcementSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200),
    message: zod_1.z.string().min(5),
    sendEmail: zod_1.z.boolean().optional().default(false)
});
