import { connectDB } from './config/db'
import { redis } from './config/redis'
import { logger } from './utils/logger'

// Initialize workers
import './modules/email/workers/email.worker'
import './modules/announcement/workers/announcement.worker'
import './modules/admin/workers/export.worker'
import './modules/admin/workers/import.worker'
import './modules/course/workers/course.worker'
import './modules/certificate/workers/certificate.worker'
import './modules/certificate/workers/pdf.worker'
import './modules/video/workers/transcode.worker'
import './modules/video/workers/upload.worker'

const WORKER_HEARTBEAT_KEY = 'health:worker:main'
const WORKER_HEARTBEAT_TTL_SECONDS = 90
const WORKER_HEARTBEAT_INTERVAL_MS = 30000

let heartbeatTimer: NodeJS.Timeout | null = null

async function publishHeartbeat() {
  await redis.set(
    WORKER_HEARTBEAT_KEY,
    JSON.stringify({
      pid: process.pid,
      updatedAt: new Date().toISOString(),
    }),
    'EX',
    WORKER_HEARTBEAT_TTL_SECONDS
  )
}

async function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }

  await redis.del(WORKER_HEARTBEAT_KEY)
}

async function start() {
  await connectDB()
  await publishHeartbeat()
  heartbeatTimer = setInterval(() => {
    publishHeartbeat().catch((err) => {
      logger.error('Failed to publish worker heartbeat', { error: err.message })
    })
  }, WORKER_HEARTBEAT_INTERVAL_MS)
  logger.info('Workers started successfully')
}

process.on('SIGINT', () => {
  stopHeartbeat().finally(() => process.exit(0))
})

process.on('SIGTERM', () => {
  stopHeartbeat().finally(() => process.exit(0))
})

start().catch((err) => {
  logger.error('Failed to start worker process', { error: err.message })
  process.exit(1)
})
