import { Document, Types } from 'mongoose'
import { PaymentStatus } from '../../enums'

export interface IPaymentMetadata {
  courseName: string
  coursePrice: number
}

export interface IPayment extends Document {
  userId: Types.ObjectId
  courseId: Types.ObjectId
  razorpayOrderId: string
  razorpayPaymentId: string | null
  razorpaySignature: string | null
  amount: number
  currency: string
  status: PaymentStatus
  metadata: IPaymentMetadata
  couponId: Types.ObjectId | null
  couponCode: string | null
  originalAmount: number
  discountAmount: number
  finalAmount: number
  createdAt: Date
  updatedAt: Date
  getDecryptedSignature(): string | null
}
