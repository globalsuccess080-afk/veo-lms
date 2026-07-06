import { createOrderSchema, verifyPaymentSchema } from '@veolms/shared'
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

export const verify = [
  authenticate,
  requireRole('student', 'admin'),
  validate(verifyPaymentSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body
    const result = await paymentService.verifyPayment(
      req.user!.id, razorpayOrderId, razorpayPaymentId, razorpaySignature
    )
    sendSuccess(res, result, 'Payment verified')
  })
]

export const confirmMock = [
  authenticate,
  requireRole('student', 'admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await paymentService.confirmMockPayment(req.user!.id, req.body.orderId)
    sendSuccess(res, result, 'Payment completed (test mode)')
  })
]

export const history = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const payments = await paymentService.getPaymentHistory(req.user!.id)
    sendSuccess(res, payments)
  })
]
