import { Enrollment } from './enrollment.model'
import { Course } from '../course/course.model'
import { Lesson } from '../lesson/lesson.model'
import { Progress } from '../progress/progress.model'
import { formatAssetPath } from '../../utils/assetPath'
import { ClientSession, Types } from 'mongoose'

export async function getMyEnrollments(userId: string) {
  const enrollments = await Enrollment.find({ userId, isActive: true })
    .populate('courseId')
    .sort({ enrolledAt: -1 })
    .lean()

  const userObjectId = new Types.ObjectId(userId)
  const courseObjectIds = enrollments
    .map((e) => {
      const course = e.courseId as any
      const courseId = course?._id || e.courseId
      return Types.ObjectId.isValid(courseId) ? new Types.ObjectId(courseId) : null
    })
    .filter((id): id is Types.ObjectId => Boolean(id))

  const [lessonCounts, completedCounts] = await Promise.all([
    Lesson.aggregate<{ _id: Types.ObjectId; totalLessons: number }>([
      { $match: { courseId: { $in: courseObjectIds } } },
      { $group: { _id: '$courseId', totalLessons: { $sum: 1 } } }
    ]),
    Progress.aggregate<{ _id: Types.ObjectId; completedLessons: number }>([
      { $match: { userId: userObjectId, courseId: { $in: courseObjectIds }, isCompleted: true } },
      { $group: { _id: '$courseId', completedLessons: { $sum: 1 } } }
    ])
  ])

  const lessonCountByCourse = new Map(lessonCounts.map((row) => [row._id.toString(), row.totalLessons]))
  const completedCountByCourse = new Map(completedCounts.map((row) => [row._id.toString(), row.completedLessons]))
  const enrollmentProgressUpdates: Parameters<typeof Enrollment.bulkWrite>[0] = []

  const data = enrollments.map((e) => {
    const course = e.courseId as { _id?: { toString(): string }; title?: string; slug?: string; thumbnail?: string; totalLessons?: number }
    const courseId = course?._id?.toString() || String(e.courseId)
    const totalLessons = lessonCountByCourse.get(courseId) ?? course?.totalLessons ?? 0
    const completedLessons = completedCountByCourse.get(courseId) ?? 0
    const progress = totalLessons > 0
      ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
      : 0
    const completedAt = progress === 100 && totalLessons > 0
      ? e.completedAt || new Date()
      : null

    if (e.progress !== progress || (e.completedAt || null)?.toString() !== (completedAt || null)?.toString()) {
      enrollmentProgressUpdates.push({
        updateOne: {
          filter: { _id: e._id },
          update: { $set: { progress, completedAt } }
        }
      })
    }

    const formattedCourse = course && typeof course === 'object'
      ? { ...course, totalLessons, thumbnail: course.thumbnail ? formatAssetPath(course.thumbnail) : course.thumbnail }
      : course
    return {
      id: e._id.toString(),
      userId: e.userId.toString(),
      courseId,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: completedAt?.toISOString() || null,
      isActive: e.isActive,
      progress,
      course: formattedCourse
    }
  })

  if (enrollmentProgressUpdates.length > 0) {
    await Enrollment.bulkWrite(enrollmentProgressUpdates)
  }

  return data
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
