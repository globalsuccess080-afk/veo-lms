import mongoose, { Schema } from 'mongoose'
import { encrypt, decrypt, hashEmail } from '../../utils/encryption'
import { USER_ROLES } from '../../enums'
import { IUser } from './user.types'

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  emailHash: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: USER_ROLES, default: 'student' },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  learningStreak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
    totalActiveDays: { type: Number, default: 0 }
  }
}, { timestamps: true })

userSchema.pre('validate', function (next) {
  if (!this.email) return next()
  const plainEmail = this.email.includes('@') ? this.email : decrypt(this.email)
  if (!this.emailHash || this.isModified('email')) {
    this.emailHash = hashEmail(plainEmail)
    if (this.email.includes('@')) {
      this.email = encrypt(plainEmail)
    }
  }
  next()
})

userSchema.methods.getDecryptedEmail = function () {
  try { return decrypt(this.email) } catch { return this.email }
}

userSchema.methods.getDecryptedName = function () {
  return this.name
}

userSchema.index({ role: 1 })

export const User = mongoose.model<IUser>('User', userSchema)
export type { IUser } from './user.types'
