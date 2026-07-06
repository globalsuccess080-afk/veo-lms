import { Queue } from 'bullmq'
import { redis } from '../../config/redis'

export const courseQueue = new Queue('course', { connection: redis })
