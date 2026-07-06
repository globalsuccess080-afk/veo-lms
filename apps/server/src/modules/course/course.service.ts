import { Course, ICourse } from './course.model'
import { Lesson } from '../lesson/lesson.model'
import { cache } from '../../utils/cache'
import { ApiError } from '../../utils/apiError'
import { CreateCourseInput } from '@veolms/shared'
import { Types } from 'mongoose'
import { courseQueue } from './course.queue'
import { findSection, removeSection } from '../../utils/sections'
import { buildQuery } from '../../utils/queryBuilder'
import { storageService } from '../../storage/StorageService'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function formatCourse(course: ICourse & { createdAt?: Date; updatedAt?: Date }) {
  return {
    id: course._id.toString(),
    title: course.title,
    slug: course.slug,
    description: course.description,
    shortDescription: course.shortDescription,
    thumbnail: course.thumbnail && !course.thumbnail.startsWith('http') 
      ? storageService.getPublicUrl(course.thumbnail) 
      : course.thumbnail,
    trailerUrl: course.trailerUrl,
    instructor: course.instructor,
    price: course.price,
    originalPrice: course.originalPrice,
    category: course.category,
    tags: course.tags,
    level: course.level,
    language: course.language,
    totalLessons: course.totalLessons,
    totalDuration: course.totalDuration,
    isPublished: course.isPublished,
    isFeatured: course.isFeatured,
    enrollmentCount: course.enrollmentCount,
    rating: course.rating,
    sections: course.sections.map(s => ({
      _id: s._id.toString(),
      title: s.title,
      order: s.order,
      lessons: s.lessons.map(l => l.toString())
    })),
    createdAt: course.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: course.updatedAt?.toISOString() || new Date().toISOString()
  }
}

async function invalidateCache(slug?: string) {
  await cache.del('courses:featured')
  await cache.del('courses:categories')
  await cache.delPattern('courses:list:*')
  if (slug) await cache.del(`courses:slug:${slug}`)
}

export async function listCourses(page = 1, limit = 12, category?: string) {
  const key = `courses:list:${page}:${limit}:${category || 'all'}`
  return cache.getOrSet(key, async () => {
    const filter: Record<string, unknown> = { isPublished: true }
    if (category) filter.category = category
    const skip = (page - 1) * limit
    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Course.countDocuments(filter)
    ])
    return {
      courses: courses.map(c => formatCourse(c as unknown as ICourse)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }, 300)
}

export async function getFeatured() {
  return cache.getOrSet('courses:featured', async () => {
    const courses = await Course.find({ isPublished: true, isFeatured: true }).limit(8).lean()
    return courses.map(c => formatCourse(c as unknown as ICourse))
  }, 600)
}

export async function getCategories() {
  return cache.getOrSet('courses:categories', async () => {
    const categories = await Course.distinct('category')
    return categories.filter(Boolean).sort()
  }, 3600)
}

export async function searchCourses(q: string, page = 1, limit = 12) {
  const skip = (page - 1) * limit
  const filter = { isPublished: true, $text: { $search: q } }
  const [courses, total] = await Promise.all([
    Course.find(filter).skip(skip).limit(limit).lean(),
    Course.countDocuments(filter)
  ])
  return {
    courses: courses.map(c => formatCourse(c as unknown as ICourse)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function getBySlug(slug: string) {
  return cache.getOrSet(`courses:slug:${slug}`, async () => {
    const course = await Course.findOne({ slug, isPublished: true }).lean()
    if (!course) throw new ApiError(404, 'Course not found')
    return formatCourse(course as unknown as ICourse)
  }, 300)
}

export async function getCurriculum(slug: string) {
  const course = await Course.findOne({ slug }).lean()
  if (!course) throw new ApiError(404, 'Course not found')
  const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 }).lean()
  return {
    sections: course.sections.map(s => ({
      _id: s._id.toString(),
      title: s.title,
      order: s.order,
      lessons: lessons
        .filter(l => l.sectionId.toString() === s._id.toString())
        .map(l => ({
          id: l._id.toString(),
          title: l.title,
          order: l.order,
          duration: l.duration,
          isPreview: l.isPreview
        }))
    }))
  }
}

export async function createCourse(data: CreateCourseInput) {
  if (data.thumbnail) {
    data.thumbnail = storageService.extractKey(data.thumbnail)
  }
  let slug = slugify(data.title)
  const existing = await Course.findOne({ slug })
  if (existing) slug = `${slug}-${Date.now()}`

  const course = await Course.create({
    ...data,
    slug,
    originalPrice: data.originalPrice ?? data.price,
    sections: []
  })
  await invalidateCache()
  return formatCourse(course)
}

export async function updateCourse(id: string, data: Partial<CreateCourseInput>) {
  const oldCourse = await Course.findById(id)
  if (!oldCourse) throw new ApiError(404, 'Course not found')

  if (data.thumbnail) {
    data.thumbnail = storageService.extractKey(data.thumbnail)
  }

  const newThumbnail = data.thumbnail
  const course = await Course.findByIdAndUpdate(id, data, { new: true })
  if (!course) throw new ApiError(404, 'Course not found')

  if (newThumbnail && oldCourse.thumbnail && newThumbnail !== oldCourse.thumbnail && !oldCourse.thumbnail.startsWith('http')) {
    await storageService.deleteFile(oldCourse.thumbnail).catch(() => {})
  }

  await invalidateCache(course.slug)
  return formatCourse(course)
}

export async function deleteCourse(id: string) {
  const course = await Course.findByIdAndDelete(id)
  if (!course) throw new ApiError(404, 'Course not found')
  
  if (course.thumbnail && !course.thumbnail.startsWith('http')) {
    await storageService.deleteFile(course.thumbnail).catch(() => {})
  }

  const lessons = await Lesson.find({ courseId: id })
  for (const lesson of lessons) {
    await storageService.deleteDirectory(`videos/${lesson._id}`).catch(() => {})
  }
  
  await Lesson.deleteMany({ courseId: id })
  await invalidateCache(course.slug)
}

export async function deleteCourses(ids: string[]) {
  if (!ids.length) return
  await courseQueue.add('bulk_delete', { action: 'bulk_delete', ids })
}

export async function publishCourse(id: string, isPublished: boolean) {
  const course = await Course.findByIdAndUpdate(id, { isPublished }, { new: true })
  if (!course) throw new ApiError(404, 'Course not found')
  await invalidateCache(course.slug)
  
  if (isPublished) {
    await courseQueue.add('notify_update', { 
      courseId: course._id, 
      message: `The course "${course.title}" has been published and is now available!` 
    })
  }

  return formatCourse(course)
}

export async function notifyCourseUpdate(courseId: string, message: string) {
  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')
  await courseQueue.add('notify_update', { courseId, message })
}

export async function addSection(courseId: string, title: string, order: number) {
  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')
  course.sections.push({ _id: new Types.ObjectId(), title, order, lessons: [] })
  course.sections.sort((a, b) => a.order - b.order)
  await course.save()
  await invalidateCache(course.slug)
  return formatCourse(course)
}

export async function deleteSection(courseId: string, sectionId: string) {
  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')
  const section = findSection(course.sections, sectionId)
  if (!section) throw new ApiError(404, 'Section not found')
  await Lesson.deleteMany({ sectionId })
  removeSection(course.sections, sectionId)
  await course.save()
  await invalidateCache(course.slug)
  return formatCourse(course)
}

export async function reorderSections(courseId: string, sectionIds: string[]) {
  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')
  
  course.sections.forEach(section => {
    const newOrder = sectionIds.indexOf(section._id.toString())
    if (newOrder !== -1) {
      section.order = newOrder
    }
  })
  
  course.sections.sort((a, b) => a.order - b.order)
  await course.save()
  await invalidateCache(course.slug)
  return formatCourse(course)
}

export async function updateSection(courseId: string, sectionId: string, title: string) {
  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')
  const section = findSection(course.sections, sectionId)
  if (!section) throw new ApiError(404, 'Section not found')
  section.title = title
  await course.save()
  await invalidateCache(course.slug)
  return formatCourse(course)
}

export async function getAllAdmin(query: any = {}) {
  const searchFields = ['title', 'slug', 'category', 'tags']
  const { filterQuery, skip, limit, sort, page } = buildQuery(query, searchFields)

  const [courses, total] = await Promise.all([
    Course.find(filterQuery).sort(sort as any).skip(skip).limit(limit).lean(),
    Course.countDocuments(filterQuery)
  ])

  return {
    courses: courses.map(c => formatCourse(c as unknown as ICourse)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function getById(id: string) {
  const course = await Course.findById(id).lean()
  if (!course) throw new ApiError(404, 'Course not found')
  return formatCourse(course as unknown as ICourse)
}

export async function recalcStats(courseId: string) {
  const lessons = await Lesson.find({ courseId })
  const totalDuration = lessons.reduce((sum, l) => sum + l.duration, 0)
  await Course.findByIdAndUpdate(courseId, {
    totalLessons: lessons.length,
    totalDuration
  })
}
