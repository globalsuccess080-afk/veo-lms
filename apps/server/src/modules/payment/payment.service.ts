import crypto from 'crypto'
import mongoose, { ClientSession } from 'mongoose'
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
import { formatAssetPath } from '../../utils/assetPath'

export const PAYMENTS_MOCK =
  !env.RAZORPAY_KEY_ID ||
  !env.RAZORPAY_KEY_SECRET ||
  env.RAZORPAY_KEY_ID.endsWith('_xxx') ||
  env.RAZORPAY_KEY_SECRET === 'xxx'

const razorpay = PAYMENTS_MOCK
  ? null
  : new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })

type FinalPaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

function normalizeStatus(status: string): FinalPaymentStatus {
  if (status === 'paid') return 'COMPLETED'
  if (status === 'created') return 'PENDING'
  if (status === 'failed') return 'FAILED'
  if (status === 'refunded') return 'REFUNDED'
  return status as FinalPaymentStatus
}

function verifyWebhookSignature(rawBody: Buffer, signature?: string) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) throw new ApiError(500, 'Razorpay webhook secret is not configured')
  if (!signature) throw new ApiError(400, 'Missing Razorpay webhook signature')
  const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  const signatureBuffer = Buffer.from(signature, 'hex')
  if (expectedBuffer.length !== signatureBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
}

async function finalizeEnrollment(userId: string, payment: any, session?: ClientSession) {
  const course = await Course.findById(payment.courseId).session(session || null)
  await createEnrollment(userId, payment.courseId.toString(), payment._id.toString(), session)

  if (payment.couponId) {
    const existingUsage = await CouponUsage.findOne({ paymentId: payment._id }).session(session || null)
    if (!existingUsage) {
      const coupon = await Coupon.findByIdAndUpdate(payment.couponId, { $inc: { usedCount: 1 } }, { new: true, session })
      if (coupon) {
        await CouponUsage.create([{
          couponId: coupon._id,
          userId,
          courseId: payment.courseId,
          paymentId: payment._id,
          couponCode: payment.couponCode,
          discountAmount: payment.discountAmount
        }], { session })
      }
    }
  }

  await Notification.create([{
    userId,
    type: 'enrollment',
    title: 'Enrollment Successful',
    message: `You are now enrolled in ${course?.title}`,
    link: `/learn/${course?.slug}`
  }], { session })

  const { User } = await import('../user/user.model')
  const user = await User.findById(userId).session(session || null)
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

  const existing = await Payment.findOne({ userId, courseId, status: { $in: ['COMPLETED', 'paid'] } })
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

  const amount = Math.round(finalAmount * 100)

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
    status: amount > 0 ? 'PENDING' : 'COMPLETED',
    metadata: { courseName: course.title, coursePrice: course.price }
  })

  if (amount === 0) {
    const payment = await Payment.findOne({ razorpayOrderId: orderId })
    const result = await finalizeEnrollment(userId, payment)
    return {
      orderId, amount, currency: 'INR', keyId: env.RAZORPAY_KEY_ID,
      courseName: course.title, mock: false, free: true, courseSlug: result.courseSlug
    }
  }

  if (PAYMENTS_MOCK) {
    const payment = await Payment.findOne({ razorpayOrderId: orderId })
    if (payment) {
      payment.razorpayPaymentId = `mock_pay_${crypto.randomBytes(8).toString('hex')}`
      payment.status = 'COMPLETED'
      await payment.save()
      const result = await finalizeEnrollment(userId, payment)
      return {
        orderId, amount, currency: 'INR', keyId: env.RAZORPAY_KEY_ID,
        courseName: course.title, mock: true, courseSlug: result.courseSlug
      }
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

async function completeCapturedPayment(orderId: string, paymentId: string) {
  if (!razorpay) throw new ApiError(400, 'Razorpay is not configured')

  const gatewayPayment = await razorpay.payments.fetch(paymentId) as any
  if (!gatewayPayment || gatewayPayment.status !== 'captured') throw new ApiError(400, 'Payment is not captured')
  if (gatewayPayment.order_id !== orderId) throw new ApiError(400, 'Payment order mismatch')

  const session = await mongoose.startSession()
  try {
    let result: { courseSlug?: string } = {}
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({ razorpayOrderId: orderId }).session(session)
      if (!payment) throw new ApiError(404, 'Payment not found')

      const status = normalizeStatus(payment.status)
      if (status === 'COMPLETED') {
        const course = await Course.findById(payment.courseId).session(session)
        result = { courseSlug: course?.slug }
        return
      }
      if (gatewayPayment.amount !== payment.amount || gatewayPayment.currency !== payment.currency) {
        payment.status = 'FAILED'
        await payment.save({ session })
        throw new ApiError(400, 'Payment amount or currency mismatch')
      }

      payment.razorpayPaymentId = paymentId
      payment.status = 'PROCESSING'
      await payment.save({ session })

      result = await finalizeEnrollment(payment.userId.toString(), payment, session)
      payment.status = 'COMPLETED'
      await payment.save({ session })
    })
    return result
  } finally {
    await session.endSession()
  }
}

async function markPaymentFailed(orderId: string, paymentId?: string) {
  const payment = await Payment.findOne({ razorpayOrderId: orderId })
  if (!payment) return
  if (normalizeStatus(payment.status) === 'COMPLETED') return
  if (paymentId) payment.razorpayPaymentId = paymentId
  payment.status = 'FAILED'
  await payment.save()
}

async function markPaymentRefunded(orderId: string) {
  const payment = await Payment.findOne({ razorpayOrderId: orderId })
  if (!payment) return
  payment.status = 'REFUNDED'
  await payment.save()
}

export async function handleRazorpayWebhook(rawBody: Buffer, signature?: string) {
  if (!verifyWebhookSignature(rawBody, signature)) throw new ApiError(400, 'Invalid Razorpay webhook signature')

  const event = JSON.parse(rawBody.toString('utf8'))
  const paymentEntity = event.payload?.payment?.entity
  const refundEntity = event.payload?.refund?.entity

  if (event.event === 'payment.captured' && paymentEntity?.id && paymentEntity?.order_id) {
    await completeCapturedPayment(paymentEntity.order_id, paymentEntity.id)
  }

  if (event.event === 'payment.failed' && paymentEntity?.order_id) {
    await markPaymentFailed(paymentEntity.order_id, paymentEntity.id)
  }

  if (event.event === 'refund.processed' && refundEntity?.payment_id && razorpay) {
    const gatewayPayment = await razorpay.payments.fetch(refundEntity.payment_id) as any
    if (gatewayPayment?.order_id) await markPaymentRefunded(gatewayPayment.order_id)
  }

  return { received: true }
}

export async function getPaymentStatus(userId: string, orderId: string) {
  const payment = await Payment.findOne({ razorpayOrderId: orderId })
  if (!payment) throw new ApiError(404, 'Payment not found')
  if (payment.userId.toString() !== userId) throw new ApiError(403, 'Unauthorized')

  const course = normalizeStatus(payment.status) === 'COMPLETED'
    ? await Course.findById(payment.courseId)
    : null

  return {
    orderId,
    status: normalizeStatus(payment.status),
    courseSlug: course?.slug || null
  }
}

export async function getPaymentHistory(userId: string) {
  const payments = await Payment.find({ userId })
    .populate('courseId', 'title slug thumbnail')
    .sort({ createdAt: -1 })
    .lean()

  return payments.map(p => ({
    id: p._id.toString(),
    amount: p.amount,
    currency: p.currency,
    status: normalizeStatus(p.status),
    courseName: p.metadata.courseName,
    course: p.courseId && typeof p.courseId === 'object'
      ? {
          id: (p.courseId as any)._id?.toString(),
          title: (p.courseId as any).title,
          slug: (p.courseId as any).slug,
          thumbnail: (p.courseId as any).thumbnail ? formatAssetPath((p.courseId as any).thumbnail) : (p.courseId as any).thumbnail,
        }
      : null,
    orderId: p.razorpayOrderId,
    paymentId: p.razorpayPaymentId,
    originalAmount: p.originalAmount,
    discountAmount: p.discountAmount,
    finalAmount: p.finalAmount,
    couponCode: p.couponCode,
    createdAt: p.createdAt.toISOString()
  }))
}
