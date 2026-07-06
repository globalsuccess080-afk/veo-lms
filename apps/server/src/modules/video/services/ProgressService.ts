import { Job } from 'bullmq'
import { Lesson } from '../../lesson/lesson.model'
import { emitVideoProgress } from '../../../utils/videoSocket'
import { VideoJobProgress, VideoStage } from '../video.types'

const STATUS_BY_STAGE: Record<VideoStage, string> = {
  UPLOADING: 'uploading', QUEUED: 'queued', ANALYZING: 'processing',
  GENERATING_THUMBNAILS: 'processing', TRANSCODING: 'processing',
  UPLOADING_STORAGE: 'uploading-storage', FINALIZING: 'processing',
  READY: 'ready', FAILED: 'failed',
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)))
}

export class ProgressService {
  private lastPercent = -1
  private lastEmitAt = 0

  constructor(private readonly job: Job, private readonly lessonId: string, private readonly startedAt: number) {}

  async transition(stage: VideoStage, progress: number, message: string, extra: ProgressExtra = {}): Promise<void> {
    const percent = clamp(progress)
    const update: Record<string, unknown> = {
      'video.status': STATUS_BY_STAGE[stage], 'video.stage': stage,
      'video.progress': percent, 'video.message': message,
      'video.etaSeconds': extra.etaSeconds ?? null,
      'video.currentQuality': extra.currentQuality ?? '',
    }
    if (stage === 'ANALYZING') update['video.startedAt'] = new Date(this.startedAt)
    if (stage === 'READY') update['video.completedAt'] = new Date()
    if (stage === 'FAILED') update['video.failedReason'] = message
    await Lesson.findByIdAndUpdate(this.lessonId, update)
    await this.publish(stage, percent, message, extra, true)
  }

  async report(stage: VideoStage, progress: number, message: string, extra: ProgressExtra = {}): Promise<void> {
    await this.publish(stage, clamp(progress), message, extra, false)
  }

  private async publish(stage: VideoStage, percent: number, message: string, extra: ProgressExtra, force: boolean) {
    const now = Date.now()
    if (!force && percent < this.lastPercent + 2 && now - this.lastEmitAt < 1000) return
    this.lastPercent = percent
    this.lastEmitAt = now
    const value: VideoJobProgress = {
      stage, progress: percent, message, etaSeconds: extra.etaSeconds ?? null,
      currentQuality: extra.currentQuality, completedQualities: extra.completedQualities ?? [],
    }
    await this.job.updateProgress(value)
    emitVideoProgress({
      lessonId: this.lessonId, jobId: String(this.job.id), percent, stage, message,
      etaSeconds: value.etaSeconds, currentQuality: value.currentQuality,
      completedQualities: value.completedQualities, elapsedMs: now - this.startedAt,
    })
  }
}

type ProgressExtra = Partial<Pick<VideoJobProgress, 'etaSeconds' | 'currentQuality' | 'completedQualities'>>
