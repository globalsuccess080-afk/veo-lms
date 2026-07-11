import { Router } from 'express'
import * as ctrl from './payment.controller'
import { paymentLimiter } from '../../middleware/rateLimiter'

const router = Router()

router.post('/create-order', paymentLimiter, ...ctrl.createOrder)
router.post('/confirm', paymentLimiter, ...ctrl.confirm)
router.get('/status/:orderId', ...ctrl.status)
router.get('/history', ...ctrl.history)

export default router
