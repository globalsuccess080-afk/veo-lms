import api from '../lib/api'
import { Lesson } from '@veolms/shared'

export async function getLessons(courseId: string) {
  const { data } = await api.get(`/lessons/course/${courseId}`)
  return data.data as Lesson[]
}

export async function getLesson(id: string) {
  const { data } = await api.get(`/lessons/${id}`)
  return data.data as Lesson
}

export async function createLesson(courseId: string, sectionId: string, body: Record<string, unknown>) {
  const { data } = await api.post(`/lessons/${courseId}/sections/${sectionId}`, body)
  return data.data as Lesson
}

export async function updateLesson(id: string, body: Record<string, unknown>) {
  const { data } = await api.put(`/lessons/${id}`, body)
  return data.data as Lesson
}

export async function deleteLesson(id: string) {
  await api.delete(`/lessons/${id}`)
}

export async function getVideoUrl(lessonId: string) {
  const { data } = await api.get(`/lessons/${lessonId}/video-url`)
  const video = data.data as {
    youtubeUrl: string
    playlistPath: string
    storagePath: string
    token: string
    expiresIn: number
    status: string
    progress: number
    thumbnail: { small: string; medium: string; large: string }
  }
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
  const videoBase = `${apiBase}/videos/stream`
  const assetBase = (import.meta.env.VITE_VIDEO_ASSET_BASE_URL || '').replace(/\/$/, '')
  const join = (base: string, value: string) => value && base ? `${base}/${value.replace(/^\//, '')}` : value
  const thumbnail = {
    small: join(assetBase, video.thumbnail.small),
    medium: join(assetBase, video.thumbnail.medium),
    large: join(assetBase, video.thumbnail.large),
  }
  return {
    ...video,
    fileUrl: video.playlistPath
      ? `${videoBase}/${video.playlistPath.replace(/^\//, '')}?token=${encodeURIComponent(video.token)}`
      : '',
    thumbnail,
    thumbnailUrl: thumbnail.medium || thumbnail.large || thumbnail.small,
  }
}
