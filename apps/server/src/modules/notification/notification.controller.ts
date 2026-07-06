import * as notificationService from './notification.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { AuthRequest } from '../../types'
import { param } from '../../utils/params'

export const list = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const page = parseInt(req.query.page as string) || 1
    const result = await notificationService.getNotifications(req.user!.id, page)
    sendSuccess(res, result.notifications, 'Success', 200, {
      page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit)
    })
  })
]

export const unreadCount = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await notificationService.getUnreadCount(req.user!.id)
    sendSuccess(res, data)
  })
]

export const markRead = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    await notificationService.markRead(req.user!.id, param(req.params.id))
    const { unread } = await notificationService.getUnreadCount(req.user!.id)
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${req.user!.id}`).emit('notification:read', { id: param(req.params.id) })
      io.to(`user:${req.user!.id}`).emit('notification:unread_count', { unread })
    }
    sendSuccess(res, null, 'Marked as read')
  })
]

export const markAllRead = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    await notificationService.markAllRead(req.user!.id)
    const io = req.app.get('io')
    if (io) io.to(`user:${req.user!.id}`).emit('notification:unread_count', { unread: 0 })
    sendSuccess(res, null, 'All marked as read')
  })
]

export const dismiss = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    await notificationService.dismiss(req.user!.id, param(req.params.id))
    const { unread } = await notificationService.getUnreadCount(req.user!.id)
    const io = req.app.get('io')
    if (io) io.to(`user:${req.user!.id}`).emit('notification:unread_count', { unread })
    sendSuccess(res, null, 'Dismissed')
  })
]
