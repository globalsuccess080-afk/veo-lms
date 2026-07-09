import path from 'path'
import { Job, Worker } from 'bullmq'
import { redis } from '../../../config/redis'
import { env } from '../../../config/env'
import { UPLOAD_ROOT } from '../../../config/upload'
import { videoUploadQueue } from '../../../config/bullmq'
import { Lesson } from '../../lesson/lesson.model'
import { storageService } from '../../../storage/StorageService'
import { CleanupService } from '../services/CleanupService'
import { MetadataService } from '../services/MetadataService'
import { ProgressService } from '../services/ProgressService'
import { ThumbnailService } from '../services/ThumbnailService'
import { QUALITY_PRESETS, TranscodeService } from '../services/TranscodeService'
import { TranscodeJobData, UploadJobData } from '../video.types'

function timemarkToSeconds(value?: string): number {
  if (!value) return 0
  const parts = value.replace(',', '.').split(':').map(Number)
  return parts.length === 3 && parts.every(Number.isFinite)
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : 0
}

async function processTranscode(job: Job<TranscodeJobData>) {
  const { lessonId, videoR2Key } = job.data
  if (!videoR2Key) {
    throw new Error('Missing source video in storage. Please re-upload the video.')
  }
  const startedAt = Date.now()
  const progress = new ProgressService(job, lessonId, startedAt)

  const ext = path.extname(videoR2Key) || '.mp4'
  const videoPath = path.join(UPLOAD_ROOT, 'videos', `${job.id}${ext}`)
  const outputDir = path.join(UPLOAD_ROOT, lessonId)
  const hlsDir = path.join(outputDir, 'hls')
  const thumbnailDir = path.join(outputDir, 'thumbnails')
  let handedOff = false

  try {
    if (!await Lesson.exists({ _id: lessonId, 'video.jobId': String(job.id) })) return { skipped: 'stale-job' }

    await progress.transition('ANALYZING', 1, 'Downloading source video')
    await storageService.downloadFile(videoR2Key, videoPath)

    await progress.report('ANALYZING', 2, 'Analyzing video')
    const metadata = await MetadataService.extractMetadata(videoPath)
    await progress.report('ANALYZING', 5, 'Video analyzed')

    await progress.transition('GENERATING_THUMBNAILS', 5, 'Generating thumbnails')
    const thumbnails = await ThumbnailService.generateThumbnails(videoPath, thumbnailDir)
    await progress.report('GENERATING_THUMBNAILS', 10, 'Thumbnails ready')

    await progress.transition('TRANSCODING', 10, 'Generating adaptive HLS renditions')
    const expectedQualities = Object.keys(QUALITY_PRESETS)
    const qualities = await TranscodeService.transcodeAllQualities(
      videoPath,
      hlsDir,
      env.VIDEO_SEGMENT_DURATION,
      info => {
        const encodedSeconds = timemarkToSeconds(info.timemark)
        const raw = metadata.duration > 0 ? encodedSeconds / metadata.duration * 100 : info.percent ?? 0
        const overall = 10 + Math.min(100, Math.max(0, raw)) * 0.6
        const elapsedSeconds = (Date.now() - startedAt) / 1000
        const etaSeconds = raw > 1 ? Math.max(0, Math.round(elapsedSeconds / raw * (100 - raw))) : null
        void progress.report('TRANSCODING', overall, 'Generating adaptive HLS renditions', {
          etaSeconds,
          completedQualities: raw >= 100 ? expectedQualities : [],
        })
      },
    )
    if (!await Lesson.exists({ _id: lessonId, 'video.jobId': String(job.id) })) return { skipped: 'stale-job' }
    await progress.transition('UPLOADING_STORAGE', 70, 'Queued for storage upload', { completedQualities: qualities })
    const uploadData: UploadJobData = {
      lessonId, transcodeJobId: String(job.id), startedAt, videoPath, outputDir,
      metadata, thumbnails, qualities,
    }
    await videoUploadQueue.add('upload', uploadData, { jobId: `video-${lessonId}-${job.id}` })
    handedOff = true

    await storageService.deleteFile(videoR2Key).catch(() => undefined)

    return { lessonId, uploadQueued: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video processing failed'
    await progress.transition('FAILED', 0, message).catch(() => undefined)
    await storageService.deleteFile(videoR2Key).catch(() => undefined)
    throw error
  } finally {
    if (!handedOff) {
      await Promise.allSettled([CleanupService.deletePath(videoPath), CleanupService.deletePath(outputDir)])
    }
  }
}

export const transcodeWorker = new Worker<TranscodeJobData>('video-transcode', processTranscode, {
  connection: redis,
  concurrency: 1,
  lockDuration: 10 * 60 * 1000,
  stalledInterval: 30 * 1000,
  maxStalledCount: 1,
})

transcodeWorker.on('failed', (job, error) => {
  console.error(`[video-transcode] job ${job?.id} failed:`, error.message)
})
