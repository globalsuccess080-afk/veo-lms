import { Queue } from 'bullmq'
import { redis } from './redis'

export const videoQueue = new Queue('video-transcode', {
  connection: redis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: false
  }
})

export const videoUploadQueue = new Queue('video-upload', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: false,
  },
})
