import mongoose, { Schema } from 'mongoose'
import { COURSE_LEVELS } from '../../enums'
import { ICourse } from './course.types'

const sectionSchema = new Schema({
  title: { type: String, required: true },
  order: { type: Number, required: true },
  lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }]
})

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  trailerUrl: { type: String, default: '' },
  instructor: {
    name: { type: String, required: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' }
  },
  price: { type: Number, required: true, default: 0 },
  originalPrice: { type: Number, default: 0 },
  category: { type: String, required: true },
  tags: [{ type: String }],
  level: { type: String, enum: COURSE_LEVELS, default: 'beginner' },
  language: { type: String, default: 'English' },
  totalLessons: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  enrollmentCount: { type: Number, default: 0 },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  sections: [sectionSchema]
}, { timestamps: true })

courseSchema.index({ isPublished: 1, isFeatured: 1 })
courseSchema.index({ category: 1, isPublished: 1 })
courseSchema.index({ title: 'text', description: 'text', tags: 'text' })

export const Course = mongoose.model<ICourse>('Course', courseSchema)
export type { ICourse, ICourseSection } from './course.types'
