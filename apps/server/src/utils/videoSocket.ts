import { Server as SocketServer } from 'socket.io'

let _io: SocketServer | null = null

export function initVideoSocket(io: SocketServer): void {
  _io = io
}

export interface VideoProgressEvent {
  lessonId: string
  jobId: string
  percent: number
  stage: string
  message: string
  etaSeconds: number | null
  currentQuality?: string
  completedQualities: string[]
  elapsedMs: number
}

export function emitVideoProgress(event: VideoProgressEvent): void {
  if (!_io) return
  // Emit to admin room so all admin tabs receive it
  _io.to('role:admin').emit('video:progress', event)
}

export function emitVideoComplete(lessonId: string, jobId: string): void {
  if (!_io) return
  _io.to('role:admin').emit('video:complete', { lessonId, jobId })
}

export function emitVideoFailed(lessonId: string, jobId: string, error: string): void {
  if (!_io) return
  _io.to('role:admin').emit('video:failed', { lessonId, jobId, error })
}
