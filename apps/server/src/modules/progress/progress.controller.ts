import { updateProgressSchema } from '@veolms/shared'
import * as progressService from './progress.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { validate } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import { AuthRequest } from '../../types'
import { param } from '../../utils/params'

export const update = [
  authenticate,
  validate(updateProgressSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { courseId, lessonId, watchedSeconds, totalSeconds, isCompleted } = req.body
    const result = await progressService.updateProgress(
      req.user!.id, courseId, lessonId, watchedSeconds, totalSeconds, isCompleted
    )
    sendSuccess(res, result)
  })
]

export const byCourse = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await progressService.getCourseProgress(req.user!.id, param(req.params.courseId))
    sendSuccess(res, data)
  })
]

export const recent = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await progressService.getRecent(req.user!.id)
    sendSuccess(res, data)
  })
]

export const byLesson = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await progressService.getLessonProgress(req.user!.id, param(req.params.lessonId))
    sendSuccess(res, data)
  })
]
