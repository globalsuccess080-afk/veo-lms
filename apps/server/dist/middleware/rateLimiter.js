"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLimiter = exports.paymentLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_1 = require("../config/redis");
const getStoreConfig = (prefix) => {
    if (process.env.NODE_ENV === 'test') {
        return {};
    }
    return {
        store: new rate_limit_redis_1.RedisStore({
            // @ts-expect-error - ioredis call signature doesn't perfectly match
            sendCommand: (...args) => redis_1.redis.call(...args),
            prefix,
        })
    };
};
// General APIs (15 minutes, 500 requests per IP)
exports.apiLimiter = (0, express_rate_limit_1.default)({
    ...getStoreConfig('rl:api:'),
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
// Authentication APIs (15 minutes, 10 requests per IP)
exports.authLimiter = (0, express_rate_limit_1.default)({
    ...getStoreConfig('rl:auth:'),
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
// Payment APIs (15 minutes, 20 requests per IP)
exports.paymentLimiter = (0, express_rate_limit_1.default)({
    ...getStoreConfig('rl:payment:'),
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many payment requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
// Video Upload APIs (60 minutes, 50 requests per IP)
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    ...getStoreConfig('rl:upload:'),
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: { success: false, message: 'Too many uploads, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
