import { Document, Types } from 'mongoose'

export interface IEnrollment extends Document {
  userId: Types.ObjectId
  courseId: Types.ObjectId
  paymentId: Types.ObjectId | null
  enrolledAt: Date
  completedAt: Date | null
  isActive: boolean
  progress: number
  createdAt: Date
  updatedAt: Date
}
