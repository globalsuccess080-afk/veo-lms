import { Router } from 'express'
import * as ctrl from './discussion.controller'

const router = Router()

router.get('/lesson/:lessonId', ...ctrl.byLesson)
router.post('/', ...ctrl.create)
router.delete('/:id', ...ctrl.remove)

export default router
