import { Document, Types } from 'mongoose'

export type AnnouncementAudienceType = 'all' | 'course'
export type AnnouncementType = 'General' | 'Course Update' | 'New Lesson' | 'Assignment' | 'Offer' | 'Maintenance' | 'Important'
export type AnnouncementPriority = 'Low' | 'Normal' | 'High' | 'Urgent'
export type AnnouncementStatus = 'draft' | 'scheduled' | 'processing' | 'sent' | 'failed'

export interface IAnnouncement extends Document {
  title: string
  message: string
  audience: {
    type: AnnouncementAudienceType
    courseId?: Types.ObjectId | null
  }
  type: AnnouncementType
  deliveryChannels: {
    inApp: boolean
    email: boolean
  }
  priority: AnnouncementPriority
  targetUrl?: string
  actionLabel?: string
  actionUrl?: string
  bannerImage?: string
  scheduledAt?: Date
  expiresAt?: Date
  status: AnnouncementStatus
  isDeleted: boolean
  deletedAt?: Date
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}
