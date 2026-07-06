import { redis } from '../config/redis'

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  }

  async set(key: string, value: unknown, ttl: number) {
    await redis.setex(key, ttl, JSON.stringify(value))
  }

  async del(key: string) {
    await redis.del(key)
  }

  async delPattern(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached) return cached
    const fresh = await fetcher()
    await this.set(key, fresh, ttl)
    return fresh
  }
}

export const cache = new CacheService()
