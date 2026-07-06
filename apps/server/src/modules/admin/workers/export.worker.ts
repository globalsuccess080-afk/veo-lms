import { Worker } from 'bullmq'
import { redis } from '../../../config/redis'
import { logger } from '../../../utils/logger'
import { Course } from '../../course/course.model'
import { User } from '../../user/user.model'
import { Enrollment } from '../../enrollment/enrollment.model'

export const adminExportWorker = new Worker(
  'adminExport',
  async (job) => {
    logger.info(`Processing admin export job ${job.id} for type: ${job.data.type}`)
    const { type } = job.data

    if (type === 'courses') {
      const courses = await Course.find().lean()
      return courses.map(c => ({
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        category: c.category,
        price: c.price,
        isPublished: c.isPublished,
        totalLessons: c.totalLessons
      }))
    }

    if (type === 'students') {
      const students = await User.find({ role: 'student' })
      return students.map(s => ({
        id: s._id.toString(),
        name: s.getDecryptedName(),
        email: s.getDecryptedEmail(),
        isActive: s.isActive,
        joined: s.createdAt.toISOString()
      }))
    }

    if (type === 'enrollments') {
      const enrollments = await Enrollment.find().populate('userId', 'name').populate('courseId', 'title').lean()
      return enrollments.map((e: any) => ({
        id: e._id.toString(),
        studentName: e.userId?.name || 'Unknown',
        courseTitle: e.courseId?.title || 'Unknown',
        progress: e.progress,
        enrolledAt: e.enrolledAt.toISOString()
      }))
    }

    throw new Error('Unknown export type')
  },
  { connection: redis }
)

adminExportWorker.on('completed', (job) => {
  logger.info(`Admin export job ${job.id} completed successfully`)
})

adminExportWorker.on('failed', (job, err) => {
  logger.error(`Admin export job ${job?.id} failed:`, err)
})
