import api from '../lib/api'

export async function updateProgress(body: {
  courseId: string
  lessonId: string
  watchedSeconds: number
  totalSeconds: number
  isCompleted?: boolean
}) {
  const { data } = await api.post('/progress/update', body)
  return data.data
}

export async function getCourseProgress(courseId: string) {
  const { data } = await api.get(`/progress/${courseId}`)
  return data.data
}

export async function getRecentProgress() {
  const { data } = await api.get('/progress/recent')
  return data.data
}

export async function getLessonProgress(lessonId: string) {
  const { data } = await api.get(`/progress/lesson/${lessonId}`)
  return data.data
}
