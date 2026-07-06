import { Router } from 'express'
import * as ctrl from './analytics.controller'

const router = Router()

router.get('/dashboard', ...ctrl.getDashboard)

export default router
