import { z } from 'zod'
import * as userService from './user.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { validate } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import { AuthRequest } from '../../types'

const updateSchema = z.object({
  name: z.string().min(2).max(60),
  avatar: z.string().nullable().optional()
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
})

export const updateMe = [
  authenticate,
  validate(updateSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await userService.updateProfile(req.user!.id, req.body.name, req.body.avatar)
    sendSuccess(res, user, 'Profile updated')
  })
]

export const updatePassword = [
  authenticate,
  validate(passwordSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    await userService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword)
    sendSuccess(res, null, 'Password updated')
  })
]
