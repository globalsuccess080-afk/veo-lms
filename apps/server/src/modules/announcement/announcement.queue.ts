import { Queue } from 'bullmq'
import { redis } from '../../config/redis'

export const announcementQueue = new Queue('announcement', { connection: redis })
