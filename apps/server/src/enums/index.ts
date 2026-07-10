export const USER_ROLES = ['student','admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type CourseLevel = (typeof COURSE_LEVELS)[number]

export const VIDEO_STATUSES = ['pending', 'uploading', 'queued', 'processing', 'uploading-storage', 'ready', 'failed'] as const
export type VideoStatus = (typeof VIDEO_STATUSES)[number]

export const VIDEO_QUALITIES = ['360p', '480p', '720p', '1080p'] as const
export type VideoQuality = (typeof VIDEO_QUALITIES)[number]

export const PAYMENT_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'created', 'paid', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const NOTIFICATION_TYPES = [
  'announcement',
  'enrollment',
  'course_update',
  'payment',
  'system'
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]
