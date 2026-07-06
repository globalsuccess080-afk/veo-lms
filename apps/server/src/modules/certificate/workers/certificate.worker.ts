import { Worker } from 'bullmq'
import { redis } from '../../../config/redis'
import { logger } from '../../../utils/logger'
import { User } from '../../user/user.model'
import { Course } from '../../course/course.model'
import { Progress } from '../../progress/progress.model'
import { Lesson } from '../../lesson/lesson.model'
import { Certificate } from '../certificate.model'
import { emailQueue } from '../../email/email.queue'
import { env } from '../../../config/env'

function generateCertificateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const certificateWorker = new Worker(
  'certificate-generate',
  async (job) => {
    const { userId, courseId } = job.data
    logger.info(`Processing certificate for user ${userId}, course ${courseId}`)

    const user = await User.findById(userId)
    const course = await Course.findById(courseId)
    if (!user || !course) throw new Error('User or Course not found')

    const totalLessons = await Lesson.countDocuments({ courseId })
    if (totalLessons === 0) throw new Error('Course has no lessons')

    const completedLessons = await Progress.countDocuments({ userId, courseId, isCompleted: true })
    const progressPct = Math.round((completedLessons / totalLessons) * 100)

    if (progressPct < 85) throw new Error(`Insufficient progress (${progressPct}%). Must be >= 85%.`)

    const existing = await Certificate.findOne({ userId, courseId })
    if (existing) {
      logger.info(`Certificate already exists for user ${userId}, course ${courseId}`)
      return existing
    }

    const certId = generateCertificateId()

    const certificate = await Certificate.create({
      userId,
      courseId,
      certificateId: certId,
      progressPercentage: progressPct,
      issuedAt: new Date(),
      status: 'active',
    })

    await emailQueue.add('send-email', {
      to: user.email,
      subject: 'Your Course Certificate is Ready!',
      html: `
        <h2>Congratulations!</h2>
        <p>Your certificate has been generated successfully.</p>
        <p><b>Course:</b> ${course.title}</p>
        <p><b>Certificate ID:</b> ${certId}</p>
        <br/>
        <a href="${env.FRONTEND_URL}/courses/${course.slug}/certificate" style="padding: 10px 20px; background: #0a1a44; color: white; text-decoration: none; border-radius: 5px;">View Certificate</a>
      `,
    })

    logger.info(`Certificate generated successfully: ${certId}`)
    return certificate
  },
  { connection: redis }
)

certificateWorker.on('completed', (job) => {
  logger.info(`Certificate job ${job.id} completed.`)
})

certificateWorker.on('failed', (job, err) => {
  logger.error(`Certificate job ${job?.id} failed:`, err)
})
