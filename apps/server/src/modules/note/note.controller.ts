import { z } from 'zod'
import * as noteService from './note.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { validate } from '../../middleware/validate.middleware'
import { AuthRequest } from '../../types'
import { param } from '../../utils/params'

const createNoteSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  content: z.string().min(1).max(2000),
  timestamp: z.number().min(0).default(0)
})

export const byLesson = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await noteService.listByLesson(req.user!.id, param(req.params.lessonId))
    sendSuccess(res, data)
  })
]

export const create = [
  authenticate,
  validate(createNoteSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const data = await noteService.createNote(req.user!.id, req.body)
    sendSuccess(res, data, 'Note saved', 201)
  })
]

export const remove = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    await noteService.deleteNote(req.user!.id, param(req.params.id))
    sendSuccess(res, null, 'Note deleted')
  })
]
