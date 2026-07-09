"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.getRedisConnectionInfo = getRedisConnectionInfo;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const isTLS = env_1.env.REDIS_URL.startsWith('rediss://');
function getRedisConnectionInfo() {
    try {
        const url = new URL(env_1.env.REDIS_URL);
        return {
            protocol: url.protocol,
            host: url.hostname,
            port: url.port || (url.protocol === 'rediss:' ? '6380' : '6379'),
            db: url.pathname.replace('/', '') || '0',
            fingerprint: crypto_1.default.createHash('sha256').update(env_1.env.REDIS_URL).digest('hex').slice(0, 12),
        };
    }
    catch {
        return {
            protocol: 'unknown',
            host: 'invalid-url',
            port: 'unknown',
            db: 'unknown',
            fingerprint: crypto_1.default.createHash('sha256').update(env_1.env.REDIS_URL).digest('hex').slice(0, 12),
        };
    }
}
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    ...(isTLS ? { tls: { rejectUnauthorized: false } } : {})
});
exports.redis.on('ready', async () => {
    try {
        await exports.redis.config('SET', 'maxmemory-policy', 'noeviction');
        logger_1.logger.info('Redis eviction policy set to noeviction');
    }
    catch (err) {
        logger_1.logger.error('Failed to set Redis eviction policy', { err });
    }
});
exports.redis.on('error', (err) => {
    logger_1.logger.error('Redis connection error', { err });
});
logger_1.logger.info('Redis client configured', getRedisConnectionInfo());
