import { Worker } from 'bullmq'
import { getRedisConnectionInfo, redis } from '../../../config/redis'
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

logger.info('Email worker initialized', {
  queueName: 'email',
  redis: getRedisConnectionInfo(),
})

emailWorker.on('ready', () => {
  logger.info('Email worker ready', {
    queueName: 'email',
    redis: getRedisConnectionInfo(),
  })
})

emailWorker.on('active', (job) => {
  logger.info('Email job active', {
    jobId: job.id,
    queueName: job.queueName,
    to: job.data.to,
    subject: job.data.subject,
  })
})

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

emailWorker.on('stalled', (jobId) => {
  logger.warn('Email job stalled', {
    jobId,
    queueName: 'email',
  })
})

emailWorker.on('error', (err) => {
  logger.error('Email worker error', {
    queueName: 'email',
    error: err.message,
    stack: err.stack,
  })
})
