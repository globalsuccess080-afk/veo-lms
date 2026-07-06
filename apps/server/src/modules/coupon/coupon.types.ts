import { Document, Types } from 'mongoose'

export interface ICoupon extends Document {
  code: string
  description: string
  type: 'fixed' | 'percentage'
  value: number
  maxDiscountAmount: number | null
  usageLimit: number | null
  usedCount: number
  validFrom: Date
  validUntil: Date
  applicableCourses: Types.ObjectId[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ICouponUsage extends Document {
  couponId: Types.ObjectId
  userId: Types.ObjectId
  courseId: Types.ObjectId
  paymentId: Types.ObjectId
  couponCode: string
  discountAmount: number
  redeemedAt: Date
}
