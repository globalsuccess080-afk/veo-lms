import { Queue } from 'bullmq'
import { redis } from '../../config/redis'

export const certificateQueue = new Queue('certificate-generate', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})
