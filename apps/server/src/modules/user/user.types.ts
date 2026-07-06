import { Document } from 'mongoose'
import { UserRole } from '../../enums'

export interface IUser extends Document {
  name: string
  email: string
  emailHash: string
  password: string
  role: UserRole
  avatar: string | null
  isActive: boolean
  lastLogin: Date | null
  learningStreak: {
    current: number
    longest: number
    lastActivityDate: Date | null
    totalActiveDays: number
  }
  createdAt: Date
  updatedAt: Date
  getDecryptedEmail(): string
  getDecryptedName(): string
}
