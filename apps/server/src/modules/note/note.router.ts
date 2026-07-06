import { Router } from 'express'
import * as ctrl from './note.controller'

const router = Router()

router.get('/lesson/:lessonId', ...ctrl.byLesson)
router.post('/', ...ctrl.create)
router.delete('/:id', ...ctrl.remove)

export default router
