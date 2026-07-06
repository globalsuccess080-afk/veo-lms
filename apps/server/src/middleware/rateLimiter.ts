import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis } from '../config/redis'

const getStoreConfig = (prefix: string) => {
  if (process.env.NODE_ENV === 'test') {
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

// General APIs (15 minutes, 500 requests per IP)
export const apiLimiter = rateLimit({
  ...getStoreConfig('rl:api:'),
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Authentication APIs (15 minutes, 10 requests per IP)
export const authLimiter = rateLimit({
  ...getStoreConfig('rl:auth:'),
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
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
