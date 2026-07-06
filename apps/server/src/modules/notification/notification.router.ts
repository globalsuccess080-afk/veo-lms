import { Router } from 'express'
import * as ctrl from './notification.controller'

const router = Router()

router.get('/', ...ctrl.list)
router.get('/unread-count', ...ctrl.unreadCount)
router.patch('/:id/read', ...ctrl.markRead)
router.patch('/read-all', ...ctrl.markAllRead)
router.delete('/:id', ...ctrl.dismiss)

export default router
