import { createLessonSchema, updateLessonSchema } from '@veolms/shared'
import * as lessonService from './lesson.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { validate } from '../../middleware/validate.middleware'
import { authenticate, optionalAuth } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { AuthRequest } from '../../types'
import { param } from '../../utils/params'

export const getById = [
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const lesson = await lessonService.getLesson(param(req.params.id), req.user?.id, req.user?.role)
    sendSuccess(res, lesson)
  })
]

export const create = [
  authenticate,
  requireRole('admin'),
  validate(createLessonSchema),
  asyncHandler(async (req, res) => {
    const lesson = await lessonService.createLesson(
      param(req.params.courseId),
      param(req.params.sectionId),
      req.body
    )
    sendSuccess(res, lesson, 'Lesson created', 201)
  })
]

export const update = [
  authenticate,
  requireRole('admin'),
  validate(updateLessonSchema),
  asyncHandler(async (req, res) => {
    const lesson = await lessonService.updateLesson(param(req.params.id), req.body)
    sendSuccess(res, lesson, 'Lesson updated')
  })
]

export const remove = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    await lessonService.deleteLesson(param(req.params.id))
    sendSuccess(res, null, 'Lesson deleted')
  })
]

export const byCourse = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const lessons = await lessonService.getLessonsByCourse(param(req.params.courseId))
    sendSuccess(res, lessons)
  })
]

export const videoUrl = [
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const url = await lessonService.getVideoUrl(param(req.params.id), req.user?.id, req.user?.role)
    sendSuccess(res, url)
  })
]
