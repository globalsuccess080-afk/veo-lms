import mongoose, { Schema } from 'mongoose'
import { encrypt, decrypt } from '../../utils/encryption'
import { PAYMENT_STATUSES } from '../../enums'
import { IPayment } from './payment.types'

const paymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: PAYMENT_STATUSES, default: 'created' },
  metadata: {
    courseName: String,
    coursePrice: Number
  },
  couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
  couponCode: { type: String, default: null },
  originalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true }
}, { timestamps: true })

paymentSchema.pre('save', function (next) {
  if (this.isModified('razorpaySignature') && this.razorpaySignature && !this.razorpaySignature.startsWith('enc:')) {
    this.razorpaySignature = 'enc:' + encrypt(this.razorpaySignature)
  }
  next()
})

paymentSchema.methods.getDecryptedSignature = function () {
  if (!this.razorpaySignature) return null
  if (this.razorpaySignature.startsWith('enc:')) return decrypt(this.razorpaySignature.slice(4))
  return this.razorpaySignature
}

paymentSchema.index({ userId: 1, createdAt: -1 })
paymentSchema.index({ status: 1 })

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema)
export type { IPayment } from './payment.types'
