import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import type { Request } from 'express'
import crypto from 'crypto'
import { redis } from '../config/redis'

const getStoreConfig = (prefix: string) => {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return {}
  }
  return {
    store: new RedisStore({
      // @ts-expect-error - ioredis call signature doesn't perfectly match
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix,
    })
  }
}

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeIp(value: string | undefined) {
  return (value || 'unknown').replace(/^::ffff:/, '').trim()
}

function getClientIp(req: Request) {
  const cfIp = firstHeaderValue(req.headers['cf-connecting-ip'])
  const realIp = firstHeaderValue(req.headers['x-real-ip'])
  const forwardedFor = firstHeaderValue(req.headers['x-forwarded-for'])
  const forwardedIp = forwardedFor?.split(',')[0]?.trim()

  return normalizeIp(cfIp || realIp || forwardedIp || req.ip || req.socket.remoteAddress)
}

function getDeviceKey(req: Request) {
  const explicitDeviceId = firstHeaderValue(req.headers['x-device-id'])
  const userAgent = firstHeaderValue(req.headers['user-agent'])
  const raw = explicitDeviceId || userAgent || 'unknown-device'
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16)
}

function getLoginIdentity(req: Request) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  return email || 'unknown-email'
}

function authKeyGenerator(req: Request) {
  return [
    req.path,
    getClientIp(req),
    getDeviceKey(req)
  ].join(':')
}

function loginIdentityKeyGenerator(req: Request) {
  return [
    req.path.includes('/admin/login') ? 'admin' : 'student',
    getLoginIdentity(req)
  ].join(':')
}

// General APIs (15 minutes, 500 requests per IP)
export const apiLimiter = rateLimit({
  ...getStoreConfig('rl:api:'),
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Authentication APIs (15 minutes, 20 requests per device/IP)
export const authLimiter = rateLimit({
  ...getStoreConfig('rl:auth:'),
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: authKeyGenerator,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

export const loginIdentityLimiter = rateLimit({
  ...getStoreConfig('rl:auth:identity:'),
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: loginIdentityKeyGenerator,
  message: { success: false, message: 'Too many login attempts for this account, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Payment APIs (15 minutes, 20 requests per IP)
export const paymentLimiter = rateLimit({
  ...getStoreConfig('rl:payment:'),
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many payment requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Video Upload APIs (60 minutes, 50 requests per IP)
export const uploadLimiter = rateLimit({
  ...getStoreConfig('rl:upload:'),
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many uploads, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})
