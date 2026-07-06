import api from '../lib/api'

export interface DiscussionMessage {
  id: string
  parentId?: string | null
  message: string
  createdAt: string
  author: { id: string; name: string; avatar: string | null; role: string }
}

export async function getDiscussion(lessonId: string) {
  const { data } = await api.get(`/discussions/lesson/${lessonId}`)
  return data.data as DiscussionMessage[]
}

export async function postMessage(body: { courseId: string; lessonId: string; parentId?: string; message: string }) {
  const { data } = await api.post('/discussions', body)
  return data.data as DiscussionMessage
}

export async function deleteMessage(id: string) {
  await api.delete(`/discussions/${id}`)
}
