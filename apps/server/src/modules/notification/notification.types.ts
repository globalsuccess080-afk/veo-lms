import { Document, Types } from 'mongoose'
import { NotificationType, UserRole } from '../../enums'

export interface INotification extends Document {
  userId: Types.ObjectId | null
  targetRole: UserRole | null
  type: NotificationType
  title: string
  message: string
  link: string | null
  targetUrl?: string
  actionLabel?: string
  actionUrl?: string
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent'
  announcementId?: Types.ObjectId
  expiresAt?: Date
  metadata: Record<string, unknown>
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}
