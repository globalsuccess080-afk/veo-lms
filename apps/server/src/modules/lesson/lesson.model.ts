import mongoose, { Schema } from 'mongoose'
import { VIDEO_STATUSES } from '../../enums'
import { ILesson } from './lesson.types'
import { VIDEO_STAGES } from '../video/video.types'

const lessonSchema = new Schema<ILesson>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  sectionId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  duration: { type: Number, default: 0 },
  isPreview: { type: Boolean, default: false },
  video: {
    status: { type: String, enum: VIDEO_STATUSES, default: 'pending' },
    progress: { type: Number, default: 0 },
    stage: { type: String, enum: VIDEO_STAGES, default: 'QUEUED' },
    message: { type: String, default: '' },
    etaSeconds: { type: Number, default: null },
    currentQuality: { type: String, default: '' },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    failedReason: { type: String, default: '' },
    jobId: { type: String, default: null },
    storageProvider: { type: String, default: 'local' },
    originalKey: { type: String, default: '' },
    masterPlaylistKey: { type: String, default: '' },
    storagePath: { type: String, default: '' },
    version: { type: String, default: '' },
    availableQualities: { type: [String], default: [] },
    transcodedAt: { type: Date, default: null },
    thumbnail: {
      small: { type: String, default: '' },
      medium: { type: String, default: '' },
      large: { type: String, default: '' }
    },
    metadata: {
      duration: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      fps: { type: Number, default: 0 },
      codec: { type: String, default: '' },
      bitrate: { type: Number, default: 0 }
    },
    youtubeUrl: { type: String, default: '' },
    completedQualities: { type: [String], default: [] }
  },
  resources: [{
    title: { type: String },
    url: { type: String },
    type: { type: String },
    size: { type: Number }
  }]
}, { timestamps: true })

lessonSchema.index({ courseId: 1, order: 1 })
lessonSchema.index({ courseId: 1, isPreview: 1 })

export const Lesson = mongoose.model<ILesson>('Lesson', lessonSchema)
export type { ILesson } from './lesson.types'
