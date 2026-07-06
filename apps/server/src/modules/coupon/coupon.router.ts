import { Router } from 'express'
import * as ctrl from './coupon.controller'

const router = Router()

router.post('/validate', ctrl.validate)

export default router
