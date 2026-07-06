export type Role = 'student' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar: string | null
  isActive: boolean
  createdAt: string
}

export interface Instructor {
  name: string
  bio: string
  avatar: string
}

export interface CourseSection {
  _id: string
  title: string
  order: number
  lessons: string[]
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string
  shortDescription: string
  thumbnail: string
  trailerUrl: string
  instructor: Instructor
  price: number
  originalPrice: number
  category: string
  tags: string[]
  level: 'beginner' | 'intermediate' | 'advanced'
  language: string
  totalLessons: number
  totalDuration: number
  isPublished: boolean
  isFeatured: boolean
  enrollmentCount: number
  rating: { average: number; count: number }
  sections: CourseSection[]
  createdAt: string
  updatedAt: string
}

export interface LessonVideo {
  status: 'pending' | 'processing' | 'ready' | 'failed'
  jobId: string | null
  storagePath?: string
  availableQualities?: string[]
  thumbnailUrl: string
  youtubeUrl?: string
  fileUrl?: string
}

export interface Lesson {
  id: string
  courseId: string
  sectionId: string
  title: string
  description: string
  order: number
  duration: number
  isPreview: boolean
  video: LessonVideo
  resources: LessonResource[]
  createdAt: string
  updatedAt: string
}

export interface LessonResource {
  title: string
  url: string
  type?: string
  size?: number
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  enrolledAt: string
  completedAt: string | null
  isActive: boolean
  progress: number
  course?: Course
  user?: User
}

export interface Progress {
  id: string
  userId: string
  courseId: string
  lessonId: string
  watchedSeconds: number
  totalSeconds: number
  isCompleted: boolean
  completedAt: string | null
  lastWatchedAt: string
}

export interface Notification {
  id: string
  userId: string | null
  targetRole: Role | null
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

export interface AuthTokens {
  accessToken: string
  user: User
}

export interface AdminStats {
  totalCourses: number
  totalStudents: number
  totalEnrollments: number
  totalRevenue: number
  recentEnrollments: Enrollment[]
}
