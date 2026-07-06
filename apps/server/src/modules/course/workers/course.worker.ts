import { Worker } from 'bullmq'
import { redis } from '../../../config/redis'
import { Course } from '../course.model'
import { Lesson } from '../../lesson/lesson.model'
import { cache } from '../../../utils/cache'
import { logger } from '../../../utils/logger'

export const courseWorker = new Worker(
  'course',
  async (job) => {
    const { action, ids } = job.data

    if (action === 'bulk_delete' && Array.isArray(ids)) {
      logger.info(`Processing bulk delete for ${ids.length} courses. Job ID: ${job.id}`)
      try {
        const courses = await Course.find({ _id: { $in: ids } })
        if (courses.length > 0) {
          await Course.deleteMany({ _id: { $in: ids } })
          await Lesson.deleteMany({ courseId: { $in: ids } })
          await cache.del('courses:featured')
          await cache.delPattern('courses:list:*')
          // invalidate specific course slugs
          for (const course of courses) {
            await cache.del(`courses:slug:${course.slug}`)
          }
          logger.info(`Successfully deleted ${courses.length} courses in batch operation.`)
        }
      } catch (error) {
        logger.error(`Error processing bulk delete job ${job.id}:`, error)
        throw error
      }
    } else if (action === 'notify_update' && job.data.courseId) {
      try {
        const course = await Course.findById(job.data.courseId)
        if (!course) return

        const { Enrollment } = await import('../../enrollment/enrollment.model')
        const { User } = await import('../../user/user.model')
        const { emailQueue } = await import('../../email/email.queue')
        const { generateCourseUpdateEmail } = await import('../../email/templates')

        const enrollments = await Enrollment.find({ courseId: course._id, isActive: true }).select('userId').lean()
        if (!enrollments.length) return

        const userIds = enrollments.map(e => e.userId)
        const users = await User.find({ _id: { $in: userIds }, isActive: true }).select('email').lean()

        const message = job.data.message || `The course "${course.title}" has been updated.`
        const htmlContent = generateCourseUpdateEmail(course.title, message)

        for (const user of users) {
          await emailQueue.add('sendEmail', {
            to: user.email,
            subject: `Course Update: ${course.title}`,
            html: htmlContent
          })
        }
        logger.info(`Queued update emails for ${users.length} students of course ${course._id}`)
      } catch (error) {
        logger.error(`Error processing notify_update job ${job.id}:`, error)
        throw error
      }
    }
  },
  { connection: redis }
)

courseWorker.on('completed', (job) => {
  logger.info(`Course job ${job.id} completed`)
})

courseWorker.on('failed', (job, err) => {
  logger.error(`Course job ${job?.id} failed with error: ${err.message}`)
})
