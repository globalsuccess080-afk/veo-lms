import * as enrollmentService from './enrollment.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { AuthRequest } from '../../types'
import { param } from '../../utils/params'

export const myEnrollments = [
  authenticate,
  requireRole('student', 'admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await enrollmentService.getMyEnrollments(req.user!.id)
    sendSuccess(res, data)
  })
]

export const check = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await enrollmentService.checkEnrollment(req.user!.id, param(req.params.courseId))
    sendSuccess(res, data)
  })
]
