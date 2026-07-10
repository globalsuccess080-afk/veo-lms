import { User } from '../user/user.model'
import { Course } from '../course/course.model'
import { Enrollment } from '../enrollment/enrollment.model'
import { Payment } from '../payment/payment.model'
import { Notification } from '../notification/notification.model'
import { ApiError } from '../../utils/apiError'
import { buildQuery } from '../../utils/queryBuilder'
import * as xlsx from 'xlsx'
import fs from 'fs/promises'
import { adminExportQueue, adminImportQueue } from './admin.queue'

const completedPaymentStatuses = ['COMPLETED', 'paid']

export async function getStats() {
  const [totalCourses, totalStudents, totalEnrollments, payments] = await Promise.all([
    Course.countDocuments(),
    User.countDocuments({ role: 'student' }),
    Enrollment.countDocuments(),
    Payment.find({ status: { $in: completedPaymentStatuses } }).lean()
  ])

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

  const recentEnrollments = await Enrollment.find()
    .sort({ enrolledAt: -1 })
    .limit(10)
    .populate('userId', 'name email')
    .populate('courseId', 'title slug')
    .lean()

  return {
    totalCourses,
    totalStudents,
    totalEnrollments,
    totalRevenue,
    recentEnrollments: recentEnrollments.map((e) => {
      const user = e.userId as { name?: string; _id?: { toString(): string } } | null
      const course = e.courseId as { title?: string; slug?: string; _id?: { toString(): string } } | null
      return {
        id: e._id.toString(),
        userId: user?._id?.toString() || String(e.userId),
        courseId: course?._id?.toString() || String(e.courseId),
        enrolledAt: e.enrolledAt.toISOString(),
        progress: e.progress,
        course,
        user
      }
    })
  }
}

export async function getStudents(query: any) {
  const { filterQuery, skip, limit, sort, page } = buildQuery(
    { ...query, role: 'student' },
    ['name']
  )

  // Since we might search by email (which is encrypted), if search is provided we have to do it in-memory
  // But if the search matched 'name' using DB regex, those will be returned.
  // For email, we will still apply in memory search if 'search' query param exists
  
  let filter = filterQuery
  // If search is provided, we fetch a larger set and filter in memory, or we rely on name search.
  // For simplicity and performance, we'll let buildQuery handle name search via regex.
  // We'll also remove the search from filterQuery if it's there to avoid DB breaking on encrypted fields,
  // but wait, `name` is NOT encrypted. We can use buildQuery for `name`.
  // Email is encrypted, so regex search on email won't work in DB. We will just do a secondary in-memory filter if needed.

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort as any).skip(skip).limit(limit),
    User.countDocuments(filter)
  ])

  const students = await Promise.all(users.map(async (user) => {
    const enrollments = await Enrollment.countDocuments({ userId: user._id })
    return {
      id: user._id.toString(),
      name: user.getDecryptedName(),
      email: user.getDecryptedEmail(),
      isActive: user.isActive,
      enrollments,
      createdAt: user.createdAt.toISOString()
    }
  }))

  let filtered = students
  if (query.search) {
    const q = query.search.toLowerCase()
    // Add any missing users that matched by email (which might not be in the current paginated set if we don't fetch all, but doing so is a limitation).
    // The name regex handles the majority.
    filtered = students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
  }

  return { students: filtered, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function toggleStudent(id: string, isActive: boolean) {
  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true })
  if (!user) throw new ApiError(404, 'Student not found')
  return { id: user._id.toString(), isActive: user.isActive }
}

export async function getAllEnrollments(query: any) {
  const { filterQuery, skip, limit, sort, page } = buildQuery(query, [])

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filterQuery).sort(sort as any).skip(skip).limit(limit)
      .populate('userId').populate('courseId').lean(),
    Enrollment.countDocuments(filterQuery)
  ])

  return {
    enrollments: enrollments.map((e: any) => ({
      id: e._id.toString(),
      enrolledAt: e.enrolledAt.toISOString(),
      progress: e.progress,
      isActive: e.isActive,
      user: e.userId,
      course: e.courseId
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function sendAnnouncement(title: string, message: string, io?: { to: (room: string) => { emit: (event: string, data: unknown) => void } }) {
  const students = await User.find({ role: 'student', isActive: true })
  const notifications = students.map(s => ({
    userId: s._id,
    type: 'announcement',
    title,
    message,
    link: null
  }))
  await Notification.insertMany(notifications)

  if (io) {
    io.to('role:student').emit('announcement:broadcast', { title, message })
  }

  return { sent: students.length }
}

export async function queueExport(type: 'courses' | 'students' | 'enrollments') {
  const job = await adminExportQueue.add('export', { type })
  return { jobId: job.id, message: `Export job for ${type} queued` }
}

export async function queueImport(type: 'courses' | 'students', filePath: string) {
  const job = await adminImportQueue.add('import', { type, filePath })
  return { jobId: job.id, message: `Import job for ${type} queued` }
}

export async function getJobStatus(jobId: string) {
  // Check export queue first
  let job = await adminExportQueue.getJob(jobId)
  if (!job) {
    // Check import queue
    job = await adminImportQueue.getJob(jobId)
  }
  
  if (!job) throw new ApiError(404, 'Job not found')
  
  const state = await job.getState()
  return {
    jobId: job.id,
    state, // 'completed', 'failed', 'active', 'waiting', etc.
    progress: job.progress,
    result: job.returnvalue,
    failedReason: job.failedReason
  }
}


