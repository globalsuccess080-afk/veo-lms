import { Job, Worker } from 'bullmq'
import { redis } from '../../../config/redis'
import { Lesson } from '../../lesson/lesson.model'
import { storageService } from '../../../storage/storageService'
import { CleanupService } from '../services/CleanupService'
import { ProgressService } from '../services/ProgressService'
import { UploadJobData } from '../video.types'
import { emitVideoComplete, emitVideoFailed } from '../../../utils/videoSocket'

async function processUpload(job: Job<UploadJobData>) {
  const data = job.data
  const startedAt = data.startedAt
  const progress = new ProgressService(job, data.lessonId, startedAt)
  const destination = `videos/${data.lessonId}/versions/${data.transcodeJobId}`
  const ownsLesson = () => Lesson.exists({ _id: data.lessonId, 'video.jobId': data.transcodeJobId })

  if (!await ownsLesson()) {
    await Promise.allSettled([CleanupService.deletePath(data.videoPath), CleanupService.deletePath(data.outputDir)])
    return { skipped: 'lesson-deleted', lessonId: data.lessonId, transcodeJobId: data.transcodeJobId }
  }

  await progress.transition('UPLOADING_STORAGE', 70, 'Uploading video files', {
    completedQualities: data.qualities,
  })

  await storageService.uploadDirectory(data.outputDir, destination, (uploaded: number, total: number) => {
    const percent = 70 + uploaded / Math.max(total, 1) * 25
    void progress.report('UPLOADING_STORAGE', percent, `Uploading ${uploaded} of ${total} files`, {
      completedQualities: data.qualities,
    })
  }, 8)

  if (!await ownsLesson()) {
    await storageService.deleteDirectory(destination).catch(() => undefined)
    await Promise.allSettled([CleanupService.deletePath(data.videoPath), CleanupService.deletePath(data.outputDir)])
    return { skipped: 'lesson-deleted', lessonId: data.lessonId, transcodeJobId: data.transcodeJobId }
  }

  await progress.transition('FINALIZING', 95, 'Finalizing video', { completedQualities: data.qualities })
  const thumbnailPrefix = `${destination}/thumbnails`
  const storagePath = `${destination}/hls`
  const duration = Number.isFinite(data.metadata.duration) && data.metadata.duration > 0
    ? Math.round(data.metadata.duration)
    : 0
  const finalized = await Lesson.findOneAndUpdate({ _id: data.lessonId, 'video.jobId': data.transcodeJobId }, {
    duration,
    'video.masterPlaylistKey': `${destination}/hls/master.m3u8`,
    'video.storagePath': storagePath,
    'video.version': data.transcodeJobId,
    'video.availableQualities': data.qualities,
    'video.transcodedAt': new Date(),
    'video.metadata': data.metadata,
    'video.thumbnail': {
      small: `${thumbnailPrefix}/${data.thumbnails.small}`,
      medium: `${thumbnailPrefix}/${data.thumbnails.medium}`,
      large: `${thumbnailPrefix}/${data.thumbnails.large}`,
    },
    'video.completedQualities': data.qualities,
    'video.failedReason': '',
  }, { new: true })
  if (!finalized) {
    await storageService.deleteDirectory(destination).catch(() => undefined)
    await Promise.allSettled([CleanupService.deletePath(data.videoPath), CleanupService.deletePath(data.outputDir)])
    return { skipped: 'stale-job', lessonId: data.lessonId, transcodeJobId: data.transcodeJobId }
  }
  
  try {
    const { recalcStats } = await import('../../course/course.service')
    await recalcStats(finalized.courseId.toString())
  } catch (e) {
    console.error('Failed to recalcStats after video upload', e)
  }

  await progress.transition('READY', 100, 'Video is ready', { completedQualities: data.qualities })
  await Promise.allSettled([CleanupService.deletePath(data.videoPath), CleanupService.deletePath(data.outputDir)])
  return { lessonId: data.lessonId, transcodeJobId: data.transcodeJobId }
}

export const uploadWorker = new Worker<UploadJobData>('video-upload', processUpload, {
  connection: redis,
  concurrency: 4,
  lockDuration: 10 * 60 * 1000,
  stalledInterval: 30 * 1000,
  maxStalledCount: 2,
})

uploadWorker.on('completed', async job => {
  if (await Lesson.exists({ _id: job.data.lessonId, 'video.jobId': job.data.transcodeJobId })) {
    emitVideoComplete(job.data.lessonId, job.data.transcodeJobId)
  }
})

uploadWorker.on('failed', async (job, error) => {
  if (!job) return
  const attempts = job.opts.attempts ?? 1
  if (job.attemptsMade < attempts) return
  const ownsLesson = await Lesson.exists({ _id: job.data.lessonId, 'video.jobId': job.data.transcodeJobId })
  if (ownsLesson) {
    const progress = new ProgressService(job, job.data.lessonId, job.data.startedAt)
    await progress.transition('FAILED', 0, error.message).catch(() => undefined)
    emitVideoFailed(job.data.lessonId, job.data.transcodeJobId, error.message)
  }
  await Promise.allSettled([
    CleanupService.deletePath(job.data.videoPath),
    CleanupService.deletePath(job.data.outputDir),
  ])
})
