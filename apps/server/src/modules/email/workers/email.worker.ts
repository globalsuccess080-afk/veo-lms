import { Worker } from 'bullmq'
import { redis } from '../../../config/redis'
import { sendEmail, SendEmailOptions } from '../email.service'
import { logger } from '../../../utils/logger'

export const emailWorker = new Worker<SendEmailOptions>(
  'email',
  async (job) => {
    logger.info('Processing email job', {
      jobId: job.id,
      queueName: job.queueName,
      to: job.data.to,
      subject: job.data.subject,
    })
    await sendEmail(job.data)
  },
  { connection: redis }
)

emailWorker.on('completed', (job) => {
  logger.info('Email job completed successfully', {
    jobId: job.id,
    queueName: job.queueName,
    to: job.data.to,
    subject: job.data.subject,
  })
})

emailWorker.on('failed', (job, err) => {
  logger.error('Email job failed', {
    jobId: job?.id,
    queueName: job?.queueName,
    to: job?.data?.to,
    subject: job?.data?.subject,
    error: err.message,
    stack: err.stack,
  })
})
