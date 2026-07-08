import api from '../lib/api'
import { Notification } from '@veolms/shared'

type AppNotification = Notification & {
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent'
  targetUrl?: string | null
  actionLabel?: string | null
  actionUrl?: string | null
}

export async function getNotifications() {
  const { data } = await api.get('/notifications')
  return data.data as AppNotification[]
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
