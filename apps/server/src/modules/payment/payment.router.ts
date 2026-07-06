import { Router } from 'express'
import * as ctrl from './payment.controller'
import { paymentLimiter } from '../../middleware/rateLimiter'

const router = Router()

router.post('/create-order', paymentLimiter, ...ctrl.createOrder)
router.post('/verify', paymentLimiter, ...ctrl.verify)
router.post('/confirm-mock', paymentLimiter, ...ctrl.confirmMock)
router.get('/history', ...ctrl.history)

export default router
