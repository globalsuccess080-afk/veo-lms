import mongoose, { Schema } from 'mongoose'
import { NOTIFICATION_TYPES, USER_ROLES } from '../../enums'
import { INotification } from './notification.types'

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  targetRole: { type: String, enum: [...USER_ROLES, null], default: null },
  type: { type: String, enum: NOTIFICATION_TYPES, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: null },
  targetUrl: { type: String, default: null },
  actionLabel: { type: String, default: null },
  actionUrl: { type: String, default: null },
  priority: { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
  announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement', default: null },
  expiresAt: { type: Date, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false }
}, { timestamps: true })

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ targetRole: 1, createdAt: -1 })
notificationSchema.index({ announcementId: 1, isRead: 1 })

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
export type { INotification } from './notification.types'
