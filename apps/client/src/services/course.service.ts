import api from '../lib/api'
import { Course } from '@veolms/shared'

export async function getCourses(page = 1, category?: string) {
  const { data } = await api.get('/courses', { params: { page, category } })
  return { courses: data.data as Course[], meta: data.meta }
}

export async function getFeatured() {
  const { data } = await api.get('/courses/featured')
  return data.data as Course[]
}

export async function searchCourses(q: string) {
  const { data } = await api.get('/courses/search', { params: { q } })
  return data.data as Course[]
}

export async function getCategories() {
  const { data } = await api.get('/courses/categories')
  return data.data as string[]
}

export async function getCourse(slug: string) {
  const { data } = await api.get(`/courses/${slug}`)
  return data.data as Course
}

export async function getCurriculum(slug: string) {
  const { data } = await api.get(`/courses/${slug}/curriculum`)
  return data.data
}

export async function getAdminCourses(params?: Record<string, any>) {
  const { data } = await api.get('/courses/manage/all', { params })
  return { courses: data.data as Course[], meta: data.meta }
}

export async function getAdminCourse(id: string) {
  const { data } = await api.get(`/courses/manage/${id}`)
  return data.data as Course
}

export async function createCourse(body: Record<string, unknown>) {
  const { data } = await api.post('/courses', body)
  return data.data as Course
}

export async function updateCourse(id: string, body: Record<string, unknown>) {
  const { data } = await api.put(`/courses/${id}`, body)
  return data.data as Course
}

export async function deleteCourse(id: string) {
  await api.delete(`/courses/${id}`)
}

export async function deleteBulkCourses(ids: string[]) {
  await api.post(`/courses/bulk-delete`, { ids })
}

export async function publishCourse(id: string, isPublished: boolean) {
  const { data } = await api.patch(`/courses/${id}/publish`, { isPublished })
  return data.data as Course
}

export async function addSection(courseId: string, title: string, order: number) {
  const { data } = await api.post(`/courses/${courseId}/sections`, { title, order })
  return data.data as Course
}

export async function updateSection(courseId: string, sectionId: string, title: string) {
  const { data } = await api.put(`/courses/${courseId}/sections/${sectionId}`, { title })
  return data.data as Course
}

export async function reorderSections(courseId: string, sectionIds: string[]) {
  const { data } = await api.put(`/courses/${courseId}/sections/reorder`, { sectionIds })
  return data.data as Course
}

export async function deleteSection(courseId: string, sectionId: string) {
  const { data } = await api.delete(`/courses/${courseId}/sections/${sectionId}`)
  return data.data as Course
}
