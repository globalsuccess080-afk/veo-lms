import { Queue } from 'bullmq'
import { redis } from '../../config/redis'

export const adminExportQueue = new Queue('adminExport', { connection: redis })
export const adminImportQueue = new Queue('adminImport', { connection: redis })
