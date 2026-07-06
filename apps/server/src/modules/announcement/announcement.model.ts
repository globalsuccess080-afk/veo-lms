import mongoose, { Schema } from 'mongoose'
import { IAnnouncement } from './announcement.types'

const announcementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: {
    type: { type: String, enum: ['all', 'course'], required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null }
  },
  type: { 
    type: String, 
    enum: ['General', 'Course Update', 'New Lesson', 'Assignment', 'Offer', 'Maintenance', 'Important'], 
    default: 'General' 
  },
  deliveryChannels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false }
  },
  priority: { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
  targetUrl: { type: String, default: null },
  actionLabel: { type: String, default: null },
  actionUrl: { type: String, default: null },
  bannerImage: { type: String, default: null },
  scheduledAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  status: { type: String, enum: ['draft', 'scheduled', 'processing', 'sent', 'failed'], default: 'draft' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

announcementSchema.index({ createdAt: -1 })
announcementSchema.index({ isDeleted: 1, status: 1 })

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema)
export * from './announcement.types'
