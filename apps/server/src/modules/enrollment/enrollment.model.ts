import mongoose, { Schema } from 'mongoose'
import { IEnrollment } from './enrollment.types'

const enrollmentSchema = new Schema<IEnrollment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  progress: { type: Number, default: 0 }
}, { timestamps: true })

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true })
enrollmentSchema.index({ courseId: 1 })

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema)
export type { IEnrollment } from './enrollment.types'
