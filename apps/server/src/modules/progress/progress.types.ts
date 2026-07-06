import { Document, Types } from 'mongoose'

export interface IProgress extends Document {
  userId: Types.ObjectId
  courseId: Types.ObjectId
  lessonId: Types.ObjectId
  watchedSeconds: number
  totalSeconds: number
  isCompleted: boolean
  completedAt: Date | null
  lastWatchedAt: Date
  createdAt: Date
  updatedAt: Date
}
