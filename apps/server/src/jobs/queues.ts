import { Queue } from 'bullmq'
import { redis } from '../config/redis'

export const exportQueue = new Queue('export', { connection: redis })
export const importQueue = new Queue('import', { connection: redis })
export const certificateQueue = new Queue('certificate-generate', { connection: redis })
