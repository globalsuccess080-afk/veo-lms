import * as adminService from './admin.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { validate } from '../../middleware/validate.middleware'
import { announcementSchema } from '@veolms/shared'
import { AuthRequest } from '../../types'
import { param } from '../../utils/params'
import { ApiError } from '../../utils/apiError'

export const stats = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const data = await adminService.getStats()
    sendSuccess(res, data)
  })
]

export const students = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await adminService.getStudents(req.query)
    sendSuccess(res, result.students, 'Success', 200, {
      page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages
    })
  })
]

export const toggleStudent = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await adminService.toggleStudent(param(req.params.id), req.body.isActive)
    sendSuccess(res, result)
  })
]

export const enrollments = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await adminService.getAllEnrollments(req.query)
    sendSuccess(res, result.enrollments, 'Success', 200, {
      page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages
    })
  })
]

export const exportCourses = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const data = await adminService.queueExport('courses')
    sendSuccess(res, data, 'Export queued successfully')
  })
]

export const exportStudents = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const data = await adminService.queueExport('students')
    sendSuccess(res, data, 'Export queued successfully')
  })
]

export const exportEnrollments = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const data = await adminService.queueExport('enrollments')
    sendSuccess(res, data, 'Export queued successfully')
  })
]

export const importCourses = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded')
  const result = await adminService.queueImport('courses', req.file.path)
  sendSuccess(res, result, 'Courses import queued successfully')
})

export const importStudents = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded')
  const result = await adminService.queueImport('students', req.file.path)
  sendSuccess(res, result, 'Students import queued successfully')
})

export const getJobStatus = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await adminService.getJobStatus(String(req.params.id))
    sendSuccess(res, result)
  })
]


