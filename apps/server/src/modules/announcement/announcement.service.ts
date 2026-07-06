import { Announcement, IAnnouncement } from './announcement.model'
import { announcementQueue } from './announcement.queue'
import { ApiError } from '../../utils/apiError'
import { Notification } from '../notification/notification.model'
import { buildQuery } from '../../utils/queryBuilder'

export async function createAnnouncement(data: Partial<IAnnouncement>, userId: string) {
  const announcement = await Announcement.create({
    ...data,
    createdBy: userId,
    status: data.scheduledAt && new Date(data.scheduledAt) > new Date() ? 'scheduled' : 'draft'
  })

  if (announcement.status === 'scheduled') {
    const delay = new Date(announcement.scheduledAt!).getTime() - Date.now()
    await announcementQueue.add('send-announcement', { announcementId: announcement._id }, { delay })
  } else if (!data.scheduledAt) {
    // If no schedule provided, send immediately
    announcement.status = 'scheduled'
    await announcement.save()
    await announcementQueue.add('send-announcement', { announcementId: announcement._id })
  }

  return announcement
}

export async function listAnnouncements(query: any) {
  const { filterQuery, skip, limit, sort, page } = buildQuery(
    { ...query, isDeleted: false },
    ['title', 'message']
  )

  const announcements = await Announcement.find(filterQuery)
    .sort(sort as any)
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await Announcement.countDocuments(filterQuery)

  // Compute open rates dynamically
  const announcementIds = announcements.map(a => a._id)
  
  const stats = await Notification.aggregate([
    { $match: { announcementId: { $in: announcementIds } } },
    { $group: { 
        _id: '$announcementId', 
        sentTo: { $sum: 1 },
        opened: { $sum: { $cond: ['$isRead', 1, 0] } }
      }
    }
  ])

  const statsMap = stats.reduce((acc, stat) => {
    acc[stat._id.toString()] = { sentTo: stat.sentTo, opened: stat.opened }
    return acc
  }, {} as Record<string, { sentTo: number, opened: number }>)

  return {
    announcements: announcements.map(a => ({
      ...a,
      id: a._id.toString(),
      stats: statsMap[a._id.toString()] || { sentTo: 0, opened: 0 }
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function getAnnouncement(id: string) {
  const announcement = await Announcement.findById(id).lean()
  if (!announcement || announcement.isDeleted) throw new ApiError(404, 'Announcement not found')
  return announcement
}

export async function deleteAnnouncement(id: string) {
  const announcement = await Announcement.findById(id)
  if (!announcement || announcement.isDeleted) throw new ApiError(404, 'Announcement not found')
  
  announcement.isDeleted = true
  announcement.deletedAt = new Date()
  await announcement.save()
  
  return { success: true }
}

export async function duplicateAnnouncement(id: string, userId: string) {
  const original = await Announcement.findById(id).lean()
  if (!original || original.isDeleted) throw new ApiError(404, 'Announcement not found')
  
  const { _id, createdAt, updatedAt, scheduledAt, status, ...rest } = original as any
  
  const announcement = await Announcement.create({
    ...rest,
    title: `${original.title} (Copy)`,
    createdBy: userId,
    status: 'draft',
    scheduledAt: null
  })
  
  return announcement
}
