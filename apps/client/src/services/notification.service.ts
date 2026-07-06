import api from '../lib/api'
import { Notification } from '@veolms/shared'

export async function getNotifications() {
  const { data } = await api.get('/notifications')
  return data.data as Notification[]
}

export async function getUnreadCount() {
  const { data } = await api.get('/notifications/unread-count')
  return data.data as { unread: number }
}

export async function markRead(id: string) {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllRead() {
  await api.patch('/notifications/read-all')
}
