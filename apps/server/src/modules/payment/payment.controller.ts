import { createOrderSchema, paymentStatusParamsSchema } from '@veolms/shared'
import * as paymentService from './payment.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { validate } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { AuthRequest } from '../../types'

export const createOrder = [
  authenticate,
  requireRole('student', 'admin'),
  validate(createOrderSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const order = await paymentService.createOrder(req.user!.id, req.body.courseId, req.body.couponCode)
    sendSuccess(res, order)
  })
]

export const status = [
  authenticate,
  requireRole('student', 'admin'),
  validate(paymentStatusParamsSchema, 'params'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { orderId } = req.params as { orderId: string }
    const result = await paymentService.getPaymentStatus(req.user!.id, orderId)
    sendSuccess(res, result)
  })
]

export const webhook = [
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature']
    const result = await paymentService.handleRazorpayWebhook(
      req.body,
      Array.isArray(signature) ? signature[0] : signature
    )
    sendSuccess(res, result)
  })
]

export const history = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const payments = await paymentService.getPaymentHistory(req.user!.id)
    sendSuccess(res, payments)
  })
]
