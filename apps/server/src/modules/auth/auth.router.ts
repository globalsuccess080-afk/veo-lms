import { Router } from 'express'
import * as ctrl from './auth.controller'
import { authLimiter } from '../../middleware/rateLimiter'

const router = Router()

router.post('/send-otp', authLimiter, ctrl.sendOtp)
router.post('/register', authLimiter, ...ctrl.register)
router.post('/login', authLimiter, ...ctrl.login)
router.post('/admin/login', authLimiter, ...ctrl.adminLogin)
router.post('/refresh', authLimiter, ctrl.refresh)
router.post('/forgot-password', authLimiter, ctrl.forgotPassword)
router.post('/reset-password', authLimiter, ctrl.resetPassword)
router.post('/logout', ...ctrl.logout)
router.get('/me', ...ctrl.me)

export default router
