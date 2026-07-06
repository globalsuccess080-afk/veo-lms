import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  otp: z.string().length(6)
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export const forgotPasswordSchema = z.object({
  email: z.string().email()
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).max(100)
})

export const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  shortDescription: z.string().min(10).max(300),
  thumbnail: z.string().optional(),
  trailerUrl: z.string().optional(),
  instructor: z.object({
    name: z.string().min(2),
    bio: z.string().optional().default(''),
    avatar: z.string().optional().default('')
  }),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  category: z.string().min(2),
  tags: z.array(z.string()).optional().default([]),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  language: z.string().default('English'),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false)
})

export const updateCourseSchema = createCourseSchema.partial()

export const createSectionSchema = z.object({
  title: z.string().min(2).max(200),
  order: z.number().int().min(0)
})

export const createLessonSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional().default(''),
  order: z.number().int().min(0),
  duration: z.number().int().min(0).default(0),
  isPreview: z.boolean().optional().default(false),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  fileUrl: z.string().optional().or(z.literal('')),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    type: z.string().optional(),
    size: z.number().optional()
  })).optional().default([])
})

export const updateLessonSchema = createLessonSchema.partial()

export const createOrderSchema = z.object({
  courseId: z.string().min(1),
  couponCode: z.string().optional()
})

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string()
})

export const updateProgressSchema = z.object({
  courseId: z.string(),
  lessonId: z.string(),
  watchedSeconds: z.number().min(0),
  totalSeconds: z.number().min(0),
  isCompleted: z.boolean().optional()
})

export const announcementSchema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(5),
  sendEmail: z.boolean().optional().default(false)
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type CreateLessonInput = z.infer<typeof createLessonSchema>
