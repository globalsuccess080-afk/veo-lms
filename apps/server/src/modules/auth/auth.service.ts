import crypto from 'crypto'
import { hashEmail } from '../../utils/encryption'
import { User } from '../user/user.model'
import { ApiError } from '../../utils/apiError'
import { generateAccessToken, generateRefreshToken } from '../../utils/generateToken'
import { redis } from '../../config/redis'
import { User as UserType } from '@veolms/shared'
import { formatAssetPath } from '../../utils/assetPath'
import { logger } from '../../utils/logger'
import { hashPassword, passwordNeedsRehash, verifyPassword } from '../../utils/password'

let emailDepsPromise: Promise<{
  emailQueue: typeof import('../email/email.queue').emailQueue
  generateOtpEmail: typeof import('../email/templates').generateOtpEmail
  generateWelcomeEmail: typeof import('../email/templates').generateWelcomeEmail
  generatePasswordResetEmail: typeof import('../email/templates').generatePasswordResetEmail
}> | null = null

function getEmailDeps() {
  emailDepsPromise ||= Promise.all([
    import('../email/email.queue'),
    import('../email/templates')
  ]).then(([queueModule, templateModule]) => ({
    emailQueue: queueModule.emailQueue,
    generateOtpEmail: templateModule.generateOtpEmail,
    generateWelcomeEmail: templateModule.generateWelcomeEmail,
    generatePasswordResetEmail: templateModule.generatePasswordResetEmail
  }))

  return emailDepsPromise
}

function formatUser(user: InstanceType<typeof User>): UserType {
  return {
    id: user._id.toString(),
    name: user.getDecryptedName(),
    email: user.getDecryptedEmail(),
    role: user.role,
    avatar: user.avatar ? formatAssetPath(user.avatar) : user.avatar,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString()
  }
}

export async function sendOtp(name: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  logger.info('OTP requested', { email: normalizedEmail, name })

  const depsPromise = getEmailDeps()
  const existing = await User.exists({ emailHash: hashEmail(normalizedEmail) })
  if (existing) throw new ApiError(409, 'Email already registered')

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await redis.set(`otp:${normalizedEmail}`, otp, 'EX', 10 * 60)
  logger.info('OTP stored in redis', { email: normalizedEmail, key: `otp:${normalizedEmail}`, expiresInSeconds: 600 })

  const { emailQueue, generateOtpEmail } = await depsPromise
  
  const job = await emailQueue.add('sendEmail', {
    to: normalizedEmail,
    subject: 'Verify your VeoLMS Account',
    html: generateOtpEmail(name, otp)
  })

  logger.info('OTP email job queued', {
    email: normalizedEmail,
    jobId: job.id,
    queueName: job.queueName,
  })

  return { message: 'OTP sent to email' }
}

export async function register(name: string, email: string, password: string, otp: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const storedOtp = await redis.get(`otp:${normalizedEmail}`)
  if (!storedOtp || storedOtp !== otp) {
    throw new ApiError(400, 'The OTP is incorrect or has expired. Please check the code or request a new OTP.')
  }

  const existing = await User.exists({ emailHash: hashEmail(normalizedEmail) })
  if (existing) throw new ApiError(409, 'Email already registered')

  const hashed = await hashPassword(password)
  const user = await User.create({ name, email: normalizedEmail, password: hashed, role: 'student' })

  await redis.del(`otp:${normalizedEmail}`)

  const { emailQueue, generateWelcomeEmail } = await getEmailDeps()
  await emailQueue.add('sendEmail', {
    to: normalizedEmail,
    subject: 'Welcome to VeoLMS',
    html: generateWelcomeEmail(name)
  })

  const payload = { id: user._id.toString(), role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60)

  return { accessToken, refreshToken, user: formatUser(user) }
}

async function handleFailedLogin(identifier: string) {
  const attemptsKey = `login_attempts:${identifier}`
  const lockKey = `login_lock:${identifier}`
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
  const normalizedEmail = email.trim().toLowerCase()
  const emailHash = hashEmail(normalizedEmail)
  const [emailLockTtl, user] = await Promise.all([
    redis.ttl(`login_lock:${normalizedEmail}`),
    User.findOne({ emailHash })
  ])

  let ttl = emailLockTtl
  if (user) {
    const userTtl = await redis.ttl(`login_lock:${user._id}`)
    ttl = Math.max(ttl, userTtl)
  }

  if (ttl > 0) {
    const minutes = Math.ceil(ttl / 60)
    throw new ApiError(403, `Account temporarily locked due to too many failed attempts. Try again in ${minutes} minute(s).`)
  }

  if (!user || !user.isActive) {
    await handleFailedLogin(normalizedEmail)
    throw new ApiError(401, 'The email or password you entered is incorrect.')
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    await Promise.all([
      handleFailedLogin(normalizedEmail),
      handleFailedLogin(user._id.toString())
    ])
    throw new ApiError(401, 'The email or password you entered is incorrect.')
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new ApiError(403, 'You do not have access to this portal')
  }

  const payload = { id: user._id.toString(), role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60)

  void Promise.all([
    redis.del(`login_attempts:${normalizedEmail}`),
    redis.del(`login_attempts:${user._id.toString()}`),
    User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } })
  ]).catch(() => undefined)

  if (passwordNeedsRehash(user.password)) {
    void hashPassword(password)
      .then((hashed) => User.updateOne({ _id: user._id }, { $set: { password: hashed } }))
      .catch(() => undefined)
  }

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
  const normalizedEmail = email.trim().toLowerCase()
  logger.info('Password reset OTP requested', { email: normalizedEmail })

  const user = await User.findOne({ emailHash: hashEmail(normalizedEmail) })
  if (!user) throw new ApiError(404, 'User not found')

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await redis.set(`reset_otp:${normalizedEmail}`, otp, 'EX', 10 * 60)
  logger.info('Password reset OTP stored in redis', { email: normalizedEmail, key: `reset_otp:${normalizedEmail}`, expiresInSeconds: 600 })

  const { emailQueue, generatePasswordResetEmail } = await getEmailDeps()
  
  const job = await emailQueue.add('sendEmail', {
    to: normalizedEmail,
    subject: 'Reset Your VeoLMS Password',
    html: generatePasswordResetEmail(user.getDecryptedName(), otp)
  })

  logger.info('Password reset email job queued', {
    email: normalizedEmail,
    jobId: job.id,
    queueName: job.queueName,
  })

  return { message: 'Password reset OTP sent to email' }
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const storedOtp = await redis.get(`reset_otp:${normalizedEmail}`)
  if (!storedOtp || storedOtp !== otp) {
    throw new ApiError(400, 'The OTP is incorrect or has expired. Please check the code or request a new OTP.')
  }

  const user = await User.findOne({ emailHash: hashEmail(normalizedEmail) })
  if (!user) throw new ApiError(404, 'User not found')

  const hashed = await hashPassword(newPassword)
  user.password = hashed
  await user.save()

  await redis.del(`reset_otp:${normalizedEmail}`)
  await redis.del(`login_attempts:${normalizedEmail}`)
  await redis.del(`login_lock:${normalizedEmail}`)
  await redis.del(`login_attempts:${user._id.toString()}`)
  await redis.del(`login_lock:${user._id.toString()}`)

  return { message: 'Password reset successfully' }
}

