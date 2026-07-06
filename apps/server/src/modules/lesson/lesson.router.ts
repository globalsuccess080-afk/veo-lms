import { Router } from 'express'
import * as ctrl from './lesson.controller'

const router = Router()

router.get('/course/:courseId', ...ctrl.byCourse)
router.get('/:id', ...ctrl.getById)
router.get('/:id/video-url', ...ctrl.videoUrl)
router.post('/:courseId/sections/:sectionId', ...ctrl.create)
router.put('/:id', ...ctrl.update)
router.delete('/:id', ...ctrl.remove)

export default router
