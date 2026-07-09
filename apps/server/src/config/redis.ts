import Redis from 'ioredis'
import { env } from './env'
import crypto from 'crypto'
import { logger } from '../utils/logger'

const isTLS = env.REDIS_URL.startsWith('rediss://')

export function getRedisConnectionInfo() {
  try {
    const url = new URL(env.REDIS_URL)
    return {
      protocol: url.protocol,
      host: url.hostname,
      port: url.port || (url.protocol === 'rediss:' ? '6380' : '6379'),
      db: url.pathname.replace('/', '') || '0',
      fingerprint: crypto.createHash('sha256').update(env.REDIS_URL).digest('hex').slice(0, 12),
    }
  } catch {
    return {
      protocol: 'unknown',
      host: 'invalid-url',
      port: 'unknown',
      db: 'unknown',
      fingerprint: crypto.createHash('sha256').update(env.REDIS_URL).digest('hex').slice(0, 12),
    }
  }
}

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  ...(isTLS ? { tls: { rejectUnauthorized: false } } : {})
})

logger.info('Redis client configured', getRedisConnectionInfo())
