import * as announcementService from './announcement.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { AuthRequest } from '../../types'
import { z } from 'zod'
import { validate } from '../../middleware/validate.middleware'
import { param, query } from '../../utils/params'

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  audience: z.object({
    type: z.enum(['all', 'course']),
    courseId: z.string().optional()
  }),
  type: z.enum(['General', 'Course Update', 'New Lesson', 'Assignment', 'Offer', 'Maintenance', 'Important']).default('General'),
  deliveryChannels: z.object({
    inApp: z.boolean().default(true),
    email: z.boolean().default(false)
  }),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).default('Normal'),
  targetUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  actionUrl: z.string().optional(),
  bannerImage: z.string().optional(),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional()
})

export const create = [
  authenticate,
  requireRole('admin'),
  validate(createAnnouncementSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await announcementService.createAnnouncement(req.body, req.user!.id)
    sendSuccess(res, data, 'Announcement created')
  })
]

export const list = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await announcementService.listAnnouncements(req.query)
    sendSuccess(res, data, 'Announcements retrieved')
  })
]

export const getOne = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await announcementService.getAnnouncement(param(req.params.id))
    sendSuccess(res, data)
  })
]

export const duplicate = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await announcementService.duplicateAnnouncement(param(req.params.id), req.user!.id)
    sendSuccess(res, data, 'Announcement duplicated')
  })
]

export const remove = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    await announcementService.deleteAnnouncement(param(req.params.id))
    sendSuccess(res, null, 'Announcement deleted')
  })
]
