import crypto from 'crypto'
import Razorpay from 'razorpay'
import { env } from '../../config/env'
import { Payment } from './payment.model'
import { Course } from '../course/course.model'
import { createEnrollment } from '../enrollment/enrollment.service'
import { Coupon, CouponUsage } from '../coupon/coupon.model'
import { validateCoupon } from '../coupon/coupon.service'
import { Notification } from '../notification/notification.model'
import { ApiError } from '../../utils/apiError'
import { logger } from '../../utils/logger'

export const PAYMENTS_MOCK =
  !env.RAZORPAY_KEY_ID ||
  !env.RAZORPAY_KEY_SECRET ||
  env.RAZORPAY_KEY_ID.endsWith('_xxx') ||
  env.RAZORPAY_KEY_SECRET === 'xxx'

const razorpay = PAYMENTS_MOCK
  ? null
  : new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })

function verifySignature(orderId: string, paymentId: string, signature: string) {
  if (PAYMENTS_MOCK && signature === 'mock_signature') return true;
  const body = `${orderId}|${paymentId}`
  const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(body).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  const signatureBuffer = Buffer.from(signature, 'hex')
  if (expectedBuffer.length !== signatureBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
}

async function finalizeEnrollment(userId: string, payment: any) {
  const course = await Course.findById(payment.courseId)
  await createEnrollment(userId, payment.courseId.toString(), payment._id.toString())

  if (payment.couponId) {
    const coupon = await Coupon.findById(payment.couponId)
    if (coupon) {
      coupon.usedCount += 1
      await coupon.save()
      await CouponUsage.create({
        couponId: coupon._id,
        userId,
        courseId: payment.courseId,
        paymentId: payment._id,
        couponCode: payment.couponCode,
        discountAmount: payment.discountAmount
      })
    }
  }

  await Notification.create({
    userId,
    type: 'enrollment',
    title: 'Enrollment Successful',
    message: `You are now enrolled in ${course?.title}`,
    link: `/learn/${course?.slug}`
  })

  const { User } = await import('../user/user.model')
  const user = await User.findById(userId)
  if (user && course && payment.amount > 0) {
    const { emailQueue } = await import('../email/email.queue')
    const { generatePaymentEmail } = await import('../email/templates')
    await emailQueue.add('sendEmail', {
      to: user.getDecryptedEmail(),
      subject: `Payment Receipt: ${course.title}`,
      html: generatePaymentEmail(user.name, payment.amount, course.title, payment.razorpayOrderId)
    })
  }

  return { courseSlug: course?.slug }
}

export async function createOrder(userId: string, courseId: string, couponCode?: string) {
  logger.debug(`[createOrder] Received couponCode: "${couponCode}" for course: ${courseId}`)
  
  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')
  if (!course.isPublished) throw new ApiError(400, 'Course not available')

  const existing = await Payment.findOne({ userId, courseId, status: 'paid' })
  if (existing) throw new ApiError(409, 'Already enrolled in this course')

  let originalAmount = course.price
  let finalAmount = course.price
  let discountAmount = 0
  let couponId = null
  let appliedCouponCode = null

  if (couponCode) {
    const validResult = await validateCoupon(couponCode, courseId)
    finalAmount = validResult.finalAmount
    discountAmount = validResult.discountAmount
    couponId = validResult.couponId
    appliedCouponCode = couponCode.toUpperCase().trim()
  }

  const amount = Math.round(finalAmount * 100) // Razorpay amount in paise

  logger.debug(`[createOrder] originalAmount: ${originalAmount}, finalAmount: ${finalAmount}, amount (paise): ${amount}`)

  let orderId = `mock_order_${crypto.randomBytes(8).toString('hex')}`
  if (!PAYMENTS_MOCK) {
    if (amount > 0) {
      try {
        logger.debug(`[createOrder] Calling Razorpay with amount: ${amount}`)
        const receiptId = `rcpt_${crypto.randomBytes(8).toString('hex')}`
        const rzpOrder = await razorpay?.orders.create({ amount, currency: 'INR', receipt: receiptId })
        if (rzpOrder) {
          orderId = rzpOrder.id
          logger.debug(`[createOrder] Razorpay order created: ${orderId}`)
        }
      } catch (err: any) {
        console.error(`[createOrder Debug] Razorpay orders.create ERROR:`, err)
        throw new ApiError(500, `Razorpay error: ${err?.message || 'Unknown payment gateway error'}`)
      }
    } else {
      orderId = `free_order_${crypto.randomBytes(8).toString('hex')}`
      logger.debug(`[createOrder] Free order generated: ${orderId}`)
    }
  }

  await Payment.create({
    userId,
    courseId,
    razorpayOrderId: orderId,
    amount,
    originalAmount,
    discountAmount,
    finalAmount,
    couponId,
    couponCode: appliedCouponCode,
    status: amount > 0 ? 'created' : 'paid',
    metadata: { courseName: course.title, coursePrice: course.price }
  })

  // If free (100% discount), automatically enroll
  if (amount === 0) {
    const payment = await Payment.findOne({ razorpayOrderId: orderId })
    const result = await finalizeEnrollment(userId, payment)
    return {
      orderId, amount, currency: 'INR', keyId: env.RAZORPAY_KEY_ID,
      courseName: course.title, mock: false, free: true, courseSlug: result.courseSlug
    }
  }

  return {
    orderId,
    amount,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID,
    courseName: course.title,
    mock: PAYMENTS_MOCK
  }
}

export async function confirmMockPayment(userId: string, orderId: string) {
  if (!PAYMENTS_MOCK) throw new ApiError(400, 'Mock payments are disabled')

  const payment = await Payment.findOne({ razorpayOrderId: orderId })
  if (!payment) throw new ApiError(404, 'Payment not found')
  if (payment.userId.toString() !== userId) throw new ApiError(403, 'Unauthorized')
  if (payment.status === 'paid') throw new ApiError(409, 'Payment already processed')

  payment.razorpayPaymentId = `mock_pay_${crypto.randomBytes(8).toString('hex')}`
  payment.status = 'paid'
  await payment.save()

  return finalizeEnrollment(userId, payment)
}

export async function verifyPayment(
  userId: string,
  orderId: string,
  paymentId: string,
  signature: string
) {
  if (!verifySignature(orderId, paymentId, signature)) {
    throw new ApiError(400, 'Invalid payment signature')
  }

  const payment = await Payment.findOne({ razorpayOrderId: orderId })
  if (!payment) throw new ApiError(404, 'Payment not found')
  if (payment.status === 'paid') throw new ApiError(409, 'Payment already processed')
  if (payment.userId.toString() !== userId) throw new ApiError(403, 'Unauthorized')

  // Amount Validation (verify payment amount matches order amount)
  if (!PAYMENTS_MOCK && razorpay) {
    try {
      const rzpPayment = await razorpay.payments.fetch(paymentId)
      if (!rzpPayment || rzpPayment.amount !== payment.amount || rzpPayment.status !== 'captured') {
        throw new ApiError(400, 'Payment amount mismatch or payment not captured')
      }
    } catch (error: any) {
      if (error instanceof ApiError) throw error
      throw new ApiError(500, 'Failed to verify payment with Razorpay')
    }
  }

  payment.razorpayPaymentId = paymentId
  payment.razorpaySignature = signature
  payment.status = 'paid'
  await payment.save()

  return finalizeEnrollment(userId, payment)
}

export async function getPaymentHistory(userId: string) {
  const payments = await Payment.find({ userId }).sort({ createdAt: -1 }).lean()
  return payments.map(p => ({
    id: p._id.toString(),
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    courseName: p.metadata.courseName,
    createdAt: p.createdAt.toISOString()
  }))
}
