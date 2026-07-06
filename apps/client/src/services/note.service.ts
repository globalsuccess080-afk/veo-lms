import api from '../lib/api'

export interface LessonNote {
  id: string
  content: string
  timestamp: number
  createdAt: string
}

export async function getNotes(lessonId: string) {
  const { data } = await api.get(`/notes/lesson/${lessonId}`)
  return data.data as LessonNote[]
}

export async function createNote(body: { courseId: string; lessonId: string; content: string; timestamp: number }) {
  const { data } = await api.post('/notes', body)
  return data.data as LessonNote
}

export async function deleteNote(id: string) {
  await api.delete(`/notes/${id}`)
}
