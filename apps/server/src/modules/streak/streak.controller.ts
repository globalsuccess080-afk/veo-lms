import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import * as streakService from './streak.service'

export const getMe = [
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await streakService.getCurrentStreak(req.user!.id)
    sendSuccess(res, data)
  })
]

export const getHistory = [
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await streakService.getStreakHistory(req.user!.id)
    sendSuccess(res, data)
  })
]

export const getAdminLeaderboard = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await streakService.getAdminLeaderboard()
    sendSuccess(res, data)
  })
]
