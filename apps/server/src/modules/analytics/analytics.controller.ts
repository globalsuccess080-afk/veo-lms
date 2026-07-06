import * as analyticsService from './analytics.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { AuthRequest } from '../../types'

const auth = [authenticate, requireRole('admin')]

export const getDashboard = [
  ...auth,
  asyncHandler(async (req: AuthRequest, res) => {
    const range = (req.query.range as string) || '30d'
    const data = await analyticsService.getDashboard(req.user!.id, range)
    sendSuccess(res, data)
  })
]
