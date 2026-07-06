import { Document, Types } from 'mongoose'
import { VideoStatus } from '../../enums'
import { VideoStage } from '../video/video.types'

export interface ILessonVideoRendition {
  quality: string;
  playlistKey: string;
  width: number;
  height: number;
  bitrate: number;
}

export interface ILessonVideo {
  status: VideoStatus;
  progress: number;
  stage: VideoStage;
  message: string;
  etaSeconds: number | null;
  currentQuality: string;
  startedAt: Date | null;
  completedAt: Date | null;
  failedReason: string;
  jobId: string | null;
  storageProvider: string;
  originalKey: string;
  masterPlaylistKey: string;
  storagePath: string;
  version: string;
  availableQualities: string[];
  transcodedAt: Date | null;
  thumbnail: {
    small: string;
    medium: string;
    large: string;
  };
  metadata: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    bitrate: number;
  };
  renditions: ILessonVideoRendition[];
  completedQualities: string[];
  fileUrl?: string;
  youtubeUrl?: string;
}

export interface ILessonResource {
  title: string
  url: string
  type?: string
  size?: number
}

export interface ILesson extends Document {
  courseId: Types.ObjectId
  sectionId: Types.ObjectId
  title: string
  description: string
  order: number
  duration: number
  isPreview: boolean
  video: ILessonVideo
  resources: ILessonResource[]
  createdAt: Date
  updatedAt: Date
}
