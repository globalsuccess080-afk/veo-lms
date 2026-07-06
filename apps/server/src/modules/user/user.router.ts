import { Router } from 'express'
import * as ctrl from './user.controller'

const router = Router()

router.put('/me', ...ctrl.updateMe)
router.put('/me/password', ...ctrl.updatePassword)

export default router
