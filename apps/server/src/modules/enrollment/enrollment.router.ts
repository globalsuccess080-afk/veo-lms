import { Router } from 'express'
import * as ctrl from './enrollment.controller'

const router = Router()

router.get('/my', ...ctrl.myEnrollments)
router.get('/my/:courseId', ...ctrl.check)

export default router
