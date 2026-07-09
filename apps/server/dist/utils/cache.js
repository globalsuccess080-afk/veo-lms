"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.CacheService = void 0;
const redis_1 = require("../config/redis");
class CacheService {
    async get(key) {
        const cached = await redis_1.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async set(key, value, ttl) {
        await redis_1.redis.setex(key, ttl, JSON.stringify(value));
    }
    async del(key) {
        await redis_1.redis.del(key);
    }
    async delPattern(pattern) {
        const keys = await redis_1.redis.keys(pattern);
        if (keys.length > 0)
            await redis_1.redis.del(...keys);
    }
    async getOrSet(key, fetcher, ttl) {
        const cached = await this.get(key);
        if (cached)
            return cached;
        const fresh = await fetcher();
        await this.set(key, fresh, ttl);
        return fresh;
    }
}
exports.CacheService = CacheService;
exports.cache = new CacheService();
