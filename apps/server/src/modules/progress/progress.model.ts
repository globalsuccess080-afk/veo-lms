import mongoose, { Schema } from 'mongoose'
import { IProgress } from './progress.types'

const progressSchema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  watchedSeconds: { type: Number, default: 0 },
  totalSeconds: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  lastWatchedAt: { type: Date, default: Date.now }
}, { timestamps: true })

progressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true })
progressSchema.index({ userId: 1, lastWatchedAt: -1 })

export const Progress = mongoose.model<IProgress>('Progress', progressSchema)
export type { IProgress } from './progress.types'
