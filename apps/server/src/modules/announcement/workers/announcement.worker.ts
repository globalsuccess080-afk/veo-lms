import { Worker } from 'bullmq'
import { redis } from '../../../config/redis'
import { Announcement } from '../announcement.model'
import { User } from '../../user/user.model'
import { Enrollment } from '../../enrollment/enrollment.model'
import { Notification } from '../../notification/notification.model'
import { emailQueue } from '../../email/email.queue'
import { logger } from '../../../utils/logger'

export const announcementWorker = new Worker(
  'announcement',
  async (job) => {
    const { announcementId } = job.data
    logger.info(`Processing announcement job ${job.id} for announcement ${announcementId}`)

    const announcement = await Announcement.findById(announcementId)
    if (!announcement || announcement.isDeleted) {
      logger.warn(`Announcement ${announcementId} not found or deleted`)
      return
    }

    if (announcement.status === 'sent' || announcement.status === 'failed') {
      logger.warn(`Announcement ${announcementId} already processed with status ${announcement.status}`)
      return
    }

    announcement.status = 'processing'
    await announcement.save()

    try {
      let targetUserIds: string[] = []

      if (announcement.audience.type === 'all') {
        const users = await User.find({ role: 'student', isActive: true }).select('_id email').lean()
        targetUserIds = users.map(u => u._id.toString())
      } else if (announcement.audience.type === 'course' && announcement.audience.courseId) {
        const enrollments = await Enrollment.find({ courseId: announcement.audience.courseId, isActive: true }).select('userId').lean()
        targetUserIds = enrollments.map(e => e.userId.toString())
      }

      if (targetUserIds.length === 0) {
        announcement.status = 'sent'
        await announcement.save()
        return
      }

      // 1. Create In-App Notifications
      if (announcement.deliveryChannels.inApp) {
        const notifications = targetUserIds.map(userId => ({
          userId,
          type: 'announcement',
          title: announcement.title,
          message: announcement.message,
          priority: announcement.priority,
          announcementId: announcement._id,
          targetUrl: announcement.targetUrl,
          actionLabel: announcement.actionLabel,
          actionUrl: announcement.actionUrl,
          expiresAt: announcement.expiresAt
        }))

        // Insert in batches if large
        const batchSize = 1000
        for (let i = 0; i < notifications.length; i += batchSize) {
          await Notification.insertMany(notifications.slice(i, i + batchSize))
        }
      }

      // 2. Dispatch Emails
      if (announcement.deliveryChannels.email) {
        // Fetch users to get emails
        const users = await User.find({ _id: { $in: targetUserIds }, isActive: true }).select('email name').lean()
        
        for (const user of users) {
          await emailQueue.add('send-email', {
            to: user.email,
            subject: `VeoLMS: ${announcement.title}`,
            html: `
              <h2>${announcement.title}</h2>
              <p>${announcement.message.replace(/\n/g, '<br>')}</p>
              ${announcement.actionLabel && announcement.actionUrl ? `<a href="${announcement.actionUrl}" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:5px;">${announcement.actionLabel}</a>` : ''}
            `
          })
        }
      }

      announcement.status = 'sent'
      await announcement.save()
      logger.info(`Announcement ${announcementId} sent successfully to ${targetUserIds.length} users`)

    } catch (err) {
      logger.error(`Error processing announcement ${announcementId}:`, err)
      announcement.status = 'failed'
      await announcement.save()
      throw err
    }
  },
  { connection: redis }
)

announcementWorker.on('completed', (job) => {
  logger.info(`Announcement job ${job.id} completed`)
})

announcementWorker.on('failed', (job, err) => {
  logger.error(`Announcement job ${job?.id} failed:`, err)
})
