/**
 * Cleans all jobs (active, waiting, delayed, failed, completed)
 * from the video-transcode BullMQ queue.
 * Run: node scripts/clean-queue.mjs
 */
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import dotenv from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

// Load env
const candidates = [resolve('.env'), resolve('../../.env')]
for (const f of candidates) {
  if (existsSync(f)) { dotenv.config({ path: f }); break }
}

const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })

const queue = new Queue('video-transcode', { connection: redis })

console.log('🧹 Cleaning video-transcode queue...')

const [waiting, active, delayed, failed, completed] = await Promise.all([
  queue.getJobs(['waiting']),
  queue.getJobs(['active']),
  queue.getJobs(['delayed']),
  queue.getJobs(['failed']),
  queue.getJobs(['completed']),
])

const all = [...waiting, ...active, ...delayed, ...failed, ...completed]
console.log(`Found ${all.length} jobs total`)

for (const job of all) {
  await job.remove().catch(() => {})
  console.log(`  ✓ Removed job ${job.id} (state: ${await job.getState().catch(() => 'unknown')})`)
}

// Also obliterate the queue entirely to clear any Redis keys
await queue.obliterate({ force: true })

console.log('✅ Queue cleaned.')
await redis.quit()
process.exit(0)
