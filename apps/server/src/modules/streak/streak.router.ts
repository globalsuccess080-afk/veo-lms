import { Router } from 'express'
import * as ctrl from './streak.controller'

const router = Router()

router.get('/me', ...ctrl.getMe)
router.get('/history', ...ctrl.getHistory)
router.get('/admin/leaderboard', ...ctrl.getAdminLeaderboard)

export default router
