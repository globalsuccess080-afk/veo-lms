"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const candidates = [
    path_1.default.resolve(__dirname, '../../../../.env'),
    path_1.default.resolve(process.cwd(), '.env'),
    path_1.default.resolve(process.cwd(), '../../.env')
];
for (const file of candidates) {
    if (fs_1.default.existsSync(file)) {
        dotenv_1.default.config({ path: file });
        break;
    }
}
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    MONGODB_URI: zod_1.z.string(),
    REDIS_URL: zod_1.z.string(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    VIDEO_TOKEN_SECRET: zod_1.z.string().min(32).optional(),
    VIDEO_TOKEN_EXPIRY_SECONDS: zod_1.z.coerce.number().int().positive().default(1200),
    VIDEO_SEGMENT_URL_EXPIRY_SECONDS: zod_1.z.coerce.number().int().positive().max(14400).default(7200),
    ENCRYPTION_KEY: zod_1.z.string().length(64),
    RAZORPAY_KEY_ID: zod_1.z.string(),
    RAZORPAY_KEY_SECRET: zod_1.z.string(),
    FRONTEND_URL: zod_1.z.string().url(),
    ADMIN_EMAIL: zod_1.z.string().email().optional(),
    ADMIN_PASSWORD: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().optional(),
    // Resend HTTPS API — required on Railway Hobby (SMTP ports are blocked)
    RESEND_API_KEY: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().optional(),
    R2_ACCOUNT_ID: zod_1.z.string(),
    R2_ACCESS_KEY_ID: zod_1.z.string(),
    R2_SECRET_ACCESS_KEY: zod_1.z.string(),
    R2_BUCKET_NAME: zod_1.z.string(),
    R2_ENDPOINT: zod_1.z.string(),
    R2_PUBLIC_URL: zod_1.z.string().url().refine(value => !value.includes('.cloudflarestorage.com'), 'R2_PUBLIC_URL must be the public r2.dev/custom domain, not the private S3 API endpoint'),
    VIDEO_SEGMENT_DURATION: zod_1.z.coerce.number().default(4),
    VIDEO_TEMP_PATH: zod_1.z.string().default('uploads/temp'),
    VIDEO_MAX_SIZE: zod_1.z.string().default('500MB'),
    ENABLE_PAYLOAD_ENCRYPTION: zod_1.z.preprocess((val) => val === 'true', zod_1.z.boolean()).default(false),
    RSA_PUBLIC_KEY: zod_1.z.string().optional(),
    RSA_PRIVATE_KEY: zod_1.z.string().optional()
});
const parsed = envSchema.parse(process.env);
exports.env = {
    ...parsed,
    VIDEO_TOKEN_SECRET: parsed.VIDEO_TOKEN_SECRET || parsed.JWT_ACCESS_SECRET,
};
