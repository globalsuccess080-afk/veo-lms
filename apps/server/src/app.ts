import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { apiLimiter } from './middleware/rateLimiter'
import { UPLOAD_ROOT } from './config/upload'
import { globalEncryptionMiddleware } from './crypto/encryption.middleware'
import encryptionRouter from './modules/encryption/encryption.router'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec, swaggerUiOptions } from './config/swagger'
import mongoose from 'mongoose'
import { redis } from './config/redis'

import authRouter from './modules/auth/auth.router'
import userRouter from './modules/user/user.router'
import courseRouter from './modules/course/course.router'
import lessonRouter from './modules/lesson/lesson.router'
import enrollmentRouter from './modules/enrollment/enrollment.router'
import paymentRouter from './modules/payment/payment.router'
import progressRouter from './modules/progress/progress.router'
import adminRouter from './modules/admin/admin.router'
import notificationRouter from './modules/notification/notification.router'
import videoRouter from './modules/video/video.router'
import noteRouter from './modules/note/note.router'
import discussionRouter from './modules/discussion/discussion.router'
import couponRouter from './modules/coupon/coupon.router'
import streakRouter from './modules/streak/streak.router'
import certificateRouter from './modules/certificate/certificate.router'

const app = express()

function getHealthStatus() {
  return {
    server: true,
    mongoDB: mongoose.connection.readyState === 1,
    redis: redis.status === 'ready',
  }
}

const connectSrc = [
  "'self'",
  env.FRONTEND_URL,
  "https://api.razorpay.com",
  env.R2_PUBLIC_URL,
]

if (env.NODE_ENV === 'development') {
  connectSrc.push(
    "http://localhost:5173",
    "http://localhost:5000"
  )
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc,
      imgSrc: ["'self'", "data:", env.R2_PUBLIC_URL],
      mediaSrc: ["'self'", env.R2_PUBLIC_URL],
      frameSrc: ["https://api.razorpay.com", "https://checkout.razorpay.com"],
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}))

const allowedOrigins = env.NODE_ENV === 'production' 
  ? [env.FRONTEND_URL] 
  : ['http://localhost:5173', 'http://127.0.0.1:5173', env.FRONTEND_URL]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else if (env.NODE_ENV === 'development' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      callback(null, true)
    } else {
      console.error(`Blocked by CORS. Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(compression())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Apply Global Encryption Middleware BEFORE controllers but AFTER body parsing
app.use(globalEncryptionMiddleware)

app.use('/api', apiLimiter)

app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions))

app.get('/health', (_req, res) => {
  res.json(getHealthStatus())
})

app.get('/api/health', (_req, res) => {
  res.json(getHealthStatus())
})

app.use('/api/encryption', encryptionRouter)

app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/courses', courseRouter)
app.use('/api/lessons', lessonRouter)
app.use('/api/enrollments', enrollmentRouter)
app.use('/api/payments', paymentRouter)
app.use('/api/progress', progressRouter)
app.use('/api/admin', adminRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/videos', videoRouter)
app.use('/api/notes', noteRouter)
app.use('/api/discussions', discussionRouter)
app.use('/api/coupons', couponRouter)

import analyticsRouter from './modules/analytics/analytics.router'

app.use('/api/analytics', analyticsRouter)
app.use('/api/streak', streakRouter)
app.use('/api/certificates', certificateRouter)
app.use(errorHandler)

export default app
