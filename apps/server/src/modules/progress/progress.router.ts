import { Router } from 'express'
import * as ctrl from './progress.controller'

const router = Router()

router.post('/update', ...ctrl.update)
router.get('/dashboard', ...ctrl.studentDashboard)
router.get('/recent', ...ctrl.recent)
router.get('/lesson/:lessonId', ...ctrl.byLesson)
router.get('/:courseId', ...ctrl.byCourse)

export default router
