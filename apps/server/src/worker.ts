import { connectDB } from './config/db'
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

async function start() {
  await connectDB()
  logger.info('Workers started successfully')
}

start().catch((err) => {
  logger.error('Failed to start worker process', { error: err.message })
  process.exit(1)
})
