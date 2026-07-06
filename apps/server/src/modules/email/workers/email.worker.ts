import { Worker } from 'bullmq'
import { redis } from '../../../config/redis'
import { sendEmail, SendEmailOptions } from '../email.service'
import { logger } from '../../../utils/logger'

export const emailWorker = new Worker<SendEmailOptions>(
  'email',
  async (job) => {
    logger.info(`Processing email job ${job.id} for ${job.data.to}`)
    await sendEmail(job.data)
  },
  { connection: redis }
)

emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed successfully`)
})

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} failed:`, err)
})
