export const VIDEO_STAGES = [
  'UPLOADING', 'QUEUED', 'ANALYZING', 'GENERATING_THUMBNAILS',
  'TRANSCODING', 'UPLOADING_STORAGE', 'FINALIZING', 'READY', 'FAILED',
] as const

export type VideoStage = (typeof VIDEO_STAGES)[number]

export interface VideoJobProgress {
  stage: VideoStage
  progress: number
  message: string
  etaSeconds: number | null
  currentQuality?: string
  completedQualities: string[]
}

export interface TranscodeJobData {
  lessonId: string
  /** R2 object key of the raw source video uploaded by the server */
  videoR2Key: string
  userId?: string
}

export interface UploadJobData {
  lessonId: string
  transcodeJobId: string
  startedAt: number
  videoPath: string
  outputDir: string
  metadata: { duration: number; width: number; height: number; fps: number; codec: string; bitrate: number }
  thumbnails: { small: string; medium: string; large: string }
  qualities: string[]
}
