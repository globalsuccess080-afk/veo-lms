import api from '../lib/api'

export async function uploadVideo(file: File, lessonId: string | undefined, onProgress?: (pct: number) => void) {
  const form = new FormData()
  form.append('video', file)
  if (lessonId) form.append('lessonId', lessonId)

  const { data } = await api.post('/videos/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
  })
  return data.data as { jobId: string; status: string; lessonId: string }
}

export async function getVideoStatus(lessonId: string) {
  const { data } = await api.get(`/lessons/${lessonId}/video-url`)
  return data.data as {
    status: 'queued' | 'processing' | 'ready' | 'failed'
    jobId?: string
    fileUrl?: string
    storagePath?: string
    sources?: { quality: string; url: string }[]
    thumbnailUrl?: string
    progress?: number
  }
}

export async function uploadImage(file: File, onProgress?: (pct: number) => void) {
  const form = new FormData()
  form.append('image', file)

  const { data } = await api.post('/videos/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
  })
  return data.data as { path: string; key: string; fileName: string; size: number }
}

export async function uploadResource(file: File, onProgress?: (pct: number) => void) {
  const form = new FormData()
  form.append('file', file)

  const { data } = await api.post('/videos/resource', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
  })
  return data.data as { path: string; key: string; fileName: string; size: number; type: string }
}
