import mongoose, { Schema } from 'mongoose'
import { ICoupon, ICouponUsage } from './coupon.types'

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    applicableCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

const couponUsageSchema = new Schema<ICouponUsage>({
  couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  couponCode: { type: String, required: true },
  discountAmount: { type: Number, required: true },
  redeemedAt: { type: Date, default: Date.now }
})

couponUsageSchema.index({ couponId: 1 })
couponUsageSchema.index({ userId: 1 })
couponUsageSchema.index({ courseId: 1 })
couponUsageSchema.index({ paymentId: 1 }, { unique: true })

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema)
export const CouponUsage = mongoose.model<ICouponUsage>('CouponUsage', couponUsageSchema)
