import api from '../lib/api'
import { AdminStats } from '@veolms/shared'

export async function getStats() {
  const { data } = await api.get('/admin/stats')
  return data.data as AdminStats
}

export async function getStudents(params: any) {
  const { data } = await api.get('/admin/students', { params })
  return { students: data.data, meta: data.meta }
}

export async function toggleStudent(id: string, isActive: boolean) {
  const { data } = await api.patch(`/admin/students/${id}`, { isActive })
  return data.data
}

export async function getEnrollments(params: any) {
  const { data } = await api.get('/admin/enrollments', { params })
  return { enrollments: data.data, meta: data.meta }
}

export async function createAnnouncement(payload: any) {
  const { data } = await api.post('/admin/announcements', payload)
  return data.data
}

export async function getAnnouncements(params: any) {
  const { data } = await api.get('/admin/announcements', { params })
  return { announcements: data.data.announcements, meta: data.data }
}

export async function duplicateAnnouncement(id: string) {
  const { data } = await api.post(`/admin/announcements/${id}/duplicate`)
  return data.data
}

export async function deleteAnnouncement(id: string) {
  const { data } = await api.delete(`/admin/announcements/${id}`)
  return data.data
}

export async function getJobStatus(jobId: string) {
  const { data } = await api.get(`/admin/jobs/${jobId}`)
  return data.data
}

async function pollJob(jobId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId)
        if (status.state === 'completed') {
          clearInterval(interval)
          resolve(status.result)
        } else if (status.state === 'failed') {
          clearInterval(interval)
          reject(new Error(status.failedReason || 'Job failed'))
        }
      } catch (err) {
        clearInterval(interval)
        reject(err)
      }
    }, 1500)
  })
}

export async function exportCourses() {
  const { data } = await api.get('/admin/export/courses')
  return pollJob(data.data.jobId)
}

export async function exportStudents() {
  const { data } = await api.get('/admin/export/students')
  return pollJob(data.data.jobId)
}

export async function exportEnrollments() {
  const { data } = await api.get('/admin/export/enrollments')
  return pollJob(data.data.jobId)
}

export async function importCourses(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/admin/import/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return pollJob(data.data.jobId)
}

export async function importStudents(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/admin/import/students', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return pollJob(data.data.jobId)
}

