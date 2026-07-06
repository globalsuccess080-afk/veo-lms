import { Notification } from './notification.model'

export async function getNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const query = { 
    userId, 
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }] 
  }
  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query)
  ])
  return {
    notifications: notifications.map(n => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      targetUrl: n.targetUrl,
      actionLabel: n.actionLabel,
      actionUrl: n.actionUrl,
      priority: n.priority,
      announcementId: n.announcementId?.toString(),
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString()
    })),
    total,
    page,
    limit
  }
}

export async function getUnreadCount(userId: string) {
  const count = await Notification.countDocuments({ 
    userId, 
    isRead: false,
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }] 
  })
  return { unread: count }
}

export async function markRead(userId: string, id: string) {
  await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true })
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true })
}

export async function dismiss(userId: string, id: string) {
  await Notification.findOneAndDelete({ _id: id, userId })
}
