import { Progress } from './progress.model'
import { Lesson } from '../lesson/lesson.model'
import { Enrollment } from '../enrollment/enrollment.model'
import { updateLearningStreak, getCurrentStreak, getStreakHistory } from '../streak/streak.service'
import { formatAssetPath } from '../../utils/assetPath'
import { getMyEnrollments } from '../enrollment/enrollment.service'
import { Certificate } from '../certificate/certificate.model'

export async function updateProgress(
  userId: string,
  courseId: string,
  lessonId: string,
  watchedSeconds: number,
  totalSeconds: number,
  isCompleted?: boolean
) {
  const existing = await Progress.findOne({ userId, courseId, lessonId })
  const alreadyCompleted = existing?.isCompleted === true
  const safeTotal = totalSeconds > 0 ? totalSeconds : existing?.totalSeconds || 0

  const completed =
    alreadyCompleted || isCompleted === true || (safeTotal > 0 && watchedSeconds / safeTotal >= 0.9)

  const progress = await Progress.findOneAndUpdate(
    { userId, courseId, lessonId },
    {
      watchedSeconds,
      totalSeconds: safeTotal,
      isCompleted: completed,
      completedAt: completed ? existing?.completedAt || new Date() : null,
      lastWatchedAt: new Date()
    },
    { upsert: true, new: true }
  )

  if (completed) {
    const totalLessons = await Lesson.countDocuments({ courseId })
    const completedLessons = await Progress.countDocuments({ userId, courseId, isCompleted: true })
    const percent = Math.round((completedLessons / totalLessons) * 100)
    await Enrollment.findOneAndUpdate({ userId, courseId }, { progress: percent })
  }

  if (completed || watchedSeconds >= 180) {
    void updateLearningStreak(userId).catch(() => undefined)
  }

  return {
    id: progress._id.toString(),
    watchedSeconds: progress.watchedSeconds,
    isCompleted: progress.isCompleted
  }
}

export async function getCourseProgress(userId: string, courseId: string) {
  const progress = await Progress.find({ userId, courseId }).lean()
  return progress.map(p => ({
    lessonId: p.lessonId.toString(),
    watchedSeconds: p.watchedSeconds,
    totalSeconds: p.totalSeconds,
    isCompleted: p.isCompleted,
    lastWatchedAt: p.lastWatchedAt.toISOString()
  }))
}

export async function getRecent(userId: string) {
  const recent = await Progress.find({ userId })
    .sort({ lastWatchedAt: -1 })
    .limit(5)
    .populate('lessonId', 'title')
    .populate('courseId', 'title slug thumbnail')
    .lean()

  return recent.map(p => {
    const course = p.courseId as any
    if (course?.thumbnail) {
      course.thumbnail = formatAssetPath(course.thumbnail)
    }
    return {
      lessonId: p.lessonId,
      courseId: course,
      watchedSeconds: p.watchedSeconds,
      totalSeconds: p.totalSeconds,
      isCompleted: p.isCompleted,
      lastWatchedAt: p.lastWatchedAt.toISOString()
    }
  })
}

export async function getStudentDashboard(userId: string) {
  const [enrollments, recent, certificates, streak, streakHistory] = await Promise.all([
    getMyEnrollments(userId),
    getRecent(userId),
    Certificate.find({ userId })
      .populate('courseId', 'title slug thumbnail instructor totalLessons')
      .sort({ issuedAt: -1, createdAt: -1 })
      .limit(3)
      .lean(),
    getCurrentStreak(userId),
    getStreakHistory(userId)
  ])

  return {
    enrollments,
    recent,
    certificates: certificates.map((cert) => {
      const course = cert.courseId as any
      return {
        ...cert,
        courseId: course && typeof course === 'object'
          ? {
              ...course,
              thumbnail: course.thumbnail ? formatAssetPath(course.thumbnail) : course.thumbnail,
            }
          : course,
      }
    }),
    streak,
    streakHistory
  }
}

export async function getLessonProgress(userId: string, lessonId: string) {
  const progress = await Progress.findOne({ userId, lessonId }).lean()
  if (!progress) return { watchedSeconds: 0, isCompleted: false }
  return {
    watchedSeconds: progress.watchedSeconds,
    isCompleted: progress.isCompleted
  }
}
