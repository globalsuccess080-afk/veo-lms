import { z } from 'zod'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

const candidates = [
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env')
]

for (const file of candidates) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file })
    break
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string(),
  REDIS_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  VIDEO_TOKEN_SECRET: z.string().min(32).optional(),
  VIDEO_TOKEN_EXPIRY_SECONDS: z.coerce.number().int().positive().default(1200),
  VIDEO_SEGMENT_URL_EXPIRY_SECONDS: z.coerce.number().int().positive().max(14400).default(7200),
  ENCRYPTION_KEY: z.string().length(64),
  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().url(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  // Resend HTTPS API — required on Railway Hobby (SMTP ports are blocked)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string(),
  R2_ENDPOINT: z.string(),
  R2_PUBLIC_URL: z.string().url().refine(
    value => !value.includes('.cloudflarestorage.com'),
    'R2_PUBLIC_URL must be the public r2.dev/custom domain, not the private S3 API endpoint'
  ),

  VIDEO_SEGMENT_DURATION: z.coerce.number().default(4),
  VIDEO_TEMP_PATH: z.string().default('uploads/temp'),
  VIDEO_MAX_SIZE: z.string().default('500MB'),
  ENABLE_PAYLOAD_ENCRYPTION: z.preprocess((val) => val === 'true', z.boolean()).default(false),
  RSA_PUBLIC_KEY: z.string().optional(),
  RSA_PRIVATE_KEY: z.string().optional()
})

const parsed = envSchema.parse(process.env)

export const env = {
  ...parsed,
  VIDEO_TOKEN_SECRET: parsed.VIDEO_TOKEN_SECRET || parsed.JWT_ACCESS_SECRET,
}
