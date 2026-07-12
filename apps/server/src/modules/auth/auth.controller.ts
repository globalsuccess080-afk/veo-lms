import { Response } from 'express'
import { registerSchema, loginSchema } from '@veolms/shared'
import * as authService from './auth.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { validate } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import { AuthRequest } from '../../types'
import { env } from '../../config/env'

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
}
const clearCookieOptions = {
  secure: cookieOptions.secure,
  sameSite: cookieOptions.sameSite,
  path: cookieOptions.path
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, cookieOptions)
  res.cookie('hasRefreshToken', '1', { ...cookieOptions, httpOnly: false })
}

function clearRefreshCookies(res: Response) {
  res.clearCookie('refreshToken', { ...clearCookieOptions, httpOnly: true })
  res.clearCookie('hasRefreshToken', { ...clearCookieOptions, httpOnly: false })
}

export const sendOtp = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' })
  const result = await authService.sendOtp(name, email)
  sendSuccess(res, result, result.message)
})

export const register = [
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, otp } = req.body
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' })
    const result = await authService.register(name, email, password, otp)
    setRefreshCookie(res, result.refreshToken)
    sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Registered successfully', 201)
  })
]

export const login = [
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const result = await authService.login(email, password, 'student')
    setRefreshCookie(res, result.refreshToken)
    sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Logged in successfully')
  })
]

export const adminLogin = [
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const result = await authService.login(email, password, 'admin')
    setRefreshCookie(res, result.refreshToken)
    sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Welcome back, admin')
  })
]

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ success: false, message: 'No refresh token' })
  const result = await authService.refresh(token)
  setRefreshCookie(res, result.refreshToken)
  sendSuccess(res, { accessToken: result.accessToken })
})

export const logout = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    await authService.logout(req.user!.id)
    clearRefreshCookies(res)
    sendSuccess(res, null, 'Logged out')
  })
]

export const me = [
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await authService.getMe(req.user!.id)
    sendSuccess(res, user)
  })
]

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' })
  const result = await authService.forgotPassword(email)
  sendSuccess(res, result, result.message)
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' })
  if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
  const result = await authService.resetPassword(email, otp, newPassword)
  sendSuccess(res, result, result.message)
})

