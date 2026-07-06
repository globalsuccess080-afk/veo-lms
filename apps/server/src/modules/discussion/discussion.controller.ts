import { z } from 'zod'
import * as discussionService from './discussion.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { AuthRequest } from '../../types'
import { param } from '../../utils/params'

const createSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  parentId: z.string().optional(),
  message: z.string().min(1).max(2000)
})

export const byLesson = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await discussionService.listByLesson(param(req.params.lessonId))
    sendSuccess(res, data)
  })
]

export const create = [
  authenticate,
  validate(createSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await discussionService.createMessage(req.user!.id, req.body)
    sendSuccess(res, data, 'Message posted', 201)
  })
]

export const remove = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    await discussionService.deleteMessage(req.user!.id, req.user!.role, param(req.params.id))
    sendSuccess(res, null, 'Message deleted')
  })
]
