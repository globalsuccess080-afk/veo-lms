import api from '../lib/api'
import { AuthTokens, User } from '@veolms/shared'

export async function sendOtp(name: string, email: string) {
  const { data } = await api.post<{ message: string }>('/auth/send-otp', { name, email })
  return data
}

export async function register(name: string, email: string, password: string, otp: string) {
  const { data } = await api.post<{ data: AuthTokens }>('/auth/register', { name, email, password, otp })
  return data.data
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ data: AuthTokens }>('/auth/login', { email, password })
  return data.data
}

export async function adminLogin(email: string, password: string) {
  const { data } = await api.post<{ data: AuthTokens }>('/auth/admin/login', { email, password })
  return data.data
}

export async function logout() {
  await api.post('/auth/logout', {})
}

export async function getMe() {
  const { data } = await api.get<{ data: User }>('/auth/me')
  return data.data
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', { email, otp, newPassword })
  return data
}
