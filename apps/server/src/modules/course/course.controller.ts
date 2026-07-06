import { Response } from 'express'
import { createCourseSchema, updateCourseSchema, createSectionSchema } from '@veolms/shared'
import * as courseService from './course.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { validate } from '../../middleware/validate.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { param } from '../../utils/params'

export const list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 12
  const category = req.query.category as string
  const result = await courseService.listCourses(page, limit, category)
  sendSuccess(res, result.courses, 'Success', 200, {
    page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages
  })
})

export const featured = asyncHandler(async (_req, res) => {
  const courses = await courseService.getFeatured()
  sendSuccess(res, courses)
})

export const categories = asyncHandler(async (_req, res) => {
  const categories = await courseService.getCategories()
  sendSuccess(res, categories)
})

export const search = asyncHandler(async (req, res) => {
  const q = req.query.q as string
  const page = parseInt(req.query.page as string) || 1
  const result = await courseService.searchCourses(q, page)
  sendSuccess(res, result.courses, 'Success', 200, {
    page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages
  })
})

export const getBySlug = asyncHandler(async (req, res) => {
  const course = await courseService.getBySlug(param(req.params.slug))
  sendSuccess(res, course)
})

export const curriculum = asyncHandler(async (req, res) => {
  const data = await courseService.getCurriculum(param(req.params.slug))
  sendSuccess(res, data)
})

export const create = [
  authenticate,
  requireRole('admin'),
  validate(createCourseSchema),
  asyncHandler(async (req, res) => {
    const course = await courseService.createCourse(req.body)
    sendSuccess(res, course, 'Course created', 201)
  })
]

export const update = [
  authenticate,
  requireRole('admin'),
  validate(updateCourseSchema),
  asyncHandler(async (req, res) => {
    const course = await courseService.updateCourse(param(req.params.id), req.body)
    sendSuccess(res, course, 'Course updated')
  })
]

export const remove = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    await courseService.deleteCourse(param(req.params.id))
    sendSuccess(res, null, 'Course deleted')
  })
]

export const bulkRemove = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendSuccess(res, null, 'No courses provided', 400)
    }
    await courseService.deleteCourses(ids)
    sendSuccess(res, null, `Deletion of ${ids.length} courses started in background. They will disappear shortly.`)
  })
]

export const publish = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const course = await courseService.publishCourse(param(req.params.id), req.body.isPublished)
    sendSuccess(res, course)
  })
]

export const addSection = [
  authenticate,
  requireRole('admin'),
  validate(createSectionSchema),
  asyncHandler(async (req, res) => {
    const course = await courseService.addSection(param(req.params.id), req.body.title, req.body.order)
    sendSuccess(res, course, 'Section added', 201)
  })
]

export const removeSection = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const course = await courseService.deleteSection(param(req.params.id), param(req.params.sectionId))
    sendSuccess(res, course, 'Section deleted')
  })
]

export const reorderSections = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const course = await courseService.reorderSections(param(req.params.id), req.body.sectionIds)
    sendSuccess(res, course, 'Sections reordered')
  })
]

export const updateSection = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const course = await courseService.updateSection(param(req.params.id), param(req.params.sectionId), req.body.title)
    sendSuccess(res, course, 'Section updated')
  })
]

export const adminList = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const result = await courseService.getAllAdmin(req.query)
    sendSuccess(res, result.courses, 'Success', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    })
  })
]

export const getById = [
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const course = await courseService.getById(param(req.params.id))
    sendSuccess(res, course)
  })
]
