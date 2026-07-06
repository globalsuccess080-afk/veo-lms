import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { hashEmail } from '../../utils/encryption'
import { User } from '../user/user.model'
import { ApiError } from '../../utils/apiError'
import { generateAccessToken, generateRefreshToken } from '../../utils/generateToken'
import { redis } from '../../config/redis'
import { User as UserType } from '@veolms/shared'

function formatUser(user: InstanceType<typeof User>): UserType {
  return {
    id: user._id.toString(),
    name: user.getDecryptedName(),
    email: user.getDecryptedEmail(),
    role: user.role,
    avatar: user.avatar,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString()
  }
}

export async function sendOtp(name: string, email: string) {
  const existing = await User.findOne({ emailHash: hashEmail(email) })
  if (existing) throw new ApiError(409, 'Email already registered')

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await redis.set(`otp:${email}`, otp, 'EX', 10 * 60)

  const { emailQueue } = await import('../email/email.queue')
  const { generateOtpEmail } = await import('../email/templates')
  
  await emailQueue.add('sendEmail', {
    to: email,
    subject: 'Verify your VeoLMS Account',
    html: generateOtpEmail(name, otp)
  })

  return { message: 'OTP sent to email' }
}

export async function register(name: string, email: string, password: string, otp: string) {
  const storedOtp = await redis.get(`otp:${email}`)
  if (!storedOtp || storedOtp !== otp) throw new ApiError(400, 'Invalid or expired OTP')

  const existing = await User.findOne({ emailHash: hashEmail(email) })
  if (existing) throw new ApiError(409, 'Email already registered')

  const hashed = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, password: hashed, role: 'student' })

  await redis.del(`otp:${email}`)

  const { emailQueue } = await import('../email/email.queue')
  const { generateWelcomeEmail } = await import('../email/templates')
  await emailQueue.add('sendEmail', {
    to: email,
    subject: 'Welcome to VeoLMS',
    html: generateWelcomeEmail(name)
  })

  const payload = { id: user._id.toString(), role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60)

  return { accessToken, refreshToken, user: formatUser(user) }
}

async function handleFailedLogin(email: string) {
  const attemptsKey = `login_attempts:${email}`
  const lockKey = `login_lock:${email}`
  const attempts = await redis.incr(attemptsKey)
  if (attempts === 1) {
    await redis.expire(attemptsKey, 15 * 60) // 15 minutes window
  }
  if (attempts >= 5) {
    await redis.set(lockKey, '1', 'EX', 15 * 60) // Lock for 15 minutes
    await redis.del(attemptsKey)
  }
}

export async function login(email: string, password: string, requiredRole?: 'admin' | 'student') {
  const lockKey = `login_lock:${email}`
  const ttl = await redis.ttl(lockKey)
  if (ttl > 0) {
    const minutes = Math.ceil(ttl / 60)
    throw new ApiError(403, `Account temporarily locked due to too many failed attempts. Try again in ${minutes} minute(s).`)
  }

  const user = await User.findOne({ emailHash: hashEmail(email) })
  if (!user || !user.isActive) {
    await handleFailedLogin(email)
    throw new ApiError(401, 'Invalid credentials')
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    await handleFailedLogin(email)
    throw new ApiError(401, 'Invalid credentials')
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new ApiError(403, 'You do not have access to this portal')
  }

  // Clear failed attempts on successful login
  await redis.del(`login_attempts:${email}`)

  user.lastLogin = new Date()
  await user.save()

  const payload = { id: user._id.toString(), role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60)

  return { accessToken, refreshToken, user: formatUser(user) }
}

export async function refresh(refreshToken: string) {
  const { verifyRefreshToken } = await import('../../utils/generateToken')
  const decoded = verifyRefreshToken(refreshToken)
  const stored = await redis.get(`refresh:${decoded.id}`)
  if (!stored || stored !== refreshToken) throw new ApiError(401, 'Invalid refresh token')

  const payload = { id: decoded.id, role: decoded.role }
  const newRefresh = generateRefreshToken(payload)
  await redis.set(`refresh:${payload.id}`, newRefresh, 'EX', 7 * 24 * 60 * 60)
  const accessToken = generateAccessToken(payload)

  return { accessToken, refreshToken: newRefresh }
}

export async function logout(userId: string) {
  await redis.del(`refresh:${userId}`)
}

export async function getMe(userId: string) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')
  return formatUser(user)
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ emailHash: hashEmail(email) })
  if (!user) throw new ApiError(404, 'User not found')

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await redis.set(`reset_otp:${email}`, otp, 'EX', 10 * 60)

  const { emailQueue } = await import('../email/email.queue')
  const { generatePasswordResetEmail } = await import('../email/templates')
  
  await emailQueue.add('sendEmail', {
    to: email,
    subject: 'Reset Your VeoLMS Password',
    html: generatePasswordResetEmail(user.getDecryptedName(), otp)
  })

  return { message: 'Password reset OTP sent to email' }
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const storedOtp = await redis.get(`reset_otp:${email}`)
  if (!storedOtp || storedOtp !== otp) throw new ApiError(400, 'Invalid or expired OTP')

  const user = await User.findOne({ emailHash: hashEmail(email) })
  if (!user) throw new ApiError(404, 'User not found')

  const hashed = await bcrypt.hash(newPassword, 12)
  user.password = hashed
  await user.save()

  await redis.del(`reset_otp:${email}`)
  await redis.del(`login_attempts:${email}`)
  await redis.del(`login_lock:${email}`)

  return { message: 'Password reset successfully' }
}
