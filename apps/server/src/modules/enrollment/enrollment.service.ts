import { Enrollment } from './enrollment.model'
import { Course } from '../course/course.model'
import { formatAssetPath } from '../../utils/assetPath'
import { ClientSession } from 'mongoose'

export async function getMyEnrollments(userId: string) {
  const enrollments = await Enrollment.find({ userId, isActive: true })
    .populate('courseId')
    .sort({ enrolledAt: -1 })
    .lean()

  return enrollments.map((e) => {
    const course = e.courseId as { _id?: { toString(): string }; title?: string; slug?: string; thumbnail?: string }
    const formattedCourse = course && typeof course === 'object'
      ? { ...course, thumbnail: course.thumbnail ? formatAssetPath(course.thumbnail) : course.thumbnail }
      : course
    return {
      id: e._id.toString(),
      userId: e.userId.toString(),
      courseId: course?._id?.toString() || String(e.courseId),
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt?.toISOString() || null,
      isActive: e.isActive,
      progress: e.progress,
      course: formattedCourse
    }
  })
}

export async function checkEnrollment(userId: string, courseId: string) {
  const enrollment = await Enrollment.findOne({ userId, courseId, isActive: true })
  return { enrolled: !!enrollment, enrollment }
}

export async function createEnrollment(userId: string, courseId: string, paymentId: string, session?: ClientSession) {
  const existing = await Enrollment.findOne({ userId, courseId }).session(session || null)
  if (existing) return existing

  const [enrollment] = await Enrollment.create([{ userId, courseId, paymentId }], { session })
  const course = await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } }, { session })
  
  const { User } = await import('../user/user.model')
  const user = await User.findById(userId)

  if (user && course) {
    const { emailQueue } = await import('../email/email.queue')
    const { generateEnrollmentEmail } = await import('../email/templates')
    await emailQueue.add('sendEmail', {
      to: user.getDecryptedEmail(),
      subject: `Welcome to ${course.title}`,
      html: generateEnrollmentEmail(course.title)
    })
  }

  return enrollment
}
