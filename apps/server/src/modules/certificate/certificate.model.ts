import mongoose, { Schema, Document } from 'mongoose'

export interface ICertificate extends Document {
  userId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  certificateId: string
  progressPercentage: number
  issuedAt: Date
  emailSentAt?: Date
  status: 'active' | 'revoked'
  createdAt: Date
  updatedAt: Date
}

const certificateSchema = new Schema<ICertificate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    certificateId: { type: String, required: true, unique: true },
    progressPercentage: { type: Number, required: true },
    issuedAt: { type: Date, required: true },
    emailSentAt: { type: Date },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' }
  },
  { timestamps: true }
)

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true }) // Only one certificate per course per user
// Removed duplicate index definition

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema)
