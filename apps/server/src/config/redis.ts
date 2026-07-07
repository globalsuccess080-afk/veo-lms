import Redis from 'ioredis'
import { env } from './env'

const isTLS = env.REDIS_URL.startsWith('rediss://')

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  family: 0, // Help with IPv6 resolution for Upstash
  ...(isTLS ? { tls: { rejectUnauthorized: false } } : {})
})
