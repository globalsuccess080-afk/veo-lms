import { Document, Types } from 'mongoose'
import { CourseLevel } from '../../enums'

export interface ICourseSection {
  _id: Types.ObjectId
  title: string
  order: number
  lessons: Types.ObjectId[]
}

export interface ICourseInstructor {
  name: string
  bio: string
  avatar: string
}

export interface ICourseRating {
  average: number
  count: number
}

export interface ICourse extends Document {
  title: string
  slug: string
  description: string
  shortDescription: string
  thumbnail: string
  trailerUrl: string
  instructor: ICourseInstructor
  price: number
  originalPrice: number
  category: string
  tags: string[]
  level: CourseLevel
  language: string
  totalLessons: number
  totalDuration: number
  isPublished: boolean
  isFeatured: boolean
  enrollmentCount: number
  rating: ICourseRating
  sections: ICourseSection[]
  createdAt: Date
  updatedAt: Date
}
