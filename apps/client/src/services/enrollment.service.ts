import api from '../lib/api'

export async function getMyEnrollments() {
  const { data } = await api.get('/enrollments/my')
  return data.data
}

export async function checkEnrollment(courseId: string) {
  const { data } = await api.get(`/enrollments/my/${courseId}`)
  return data.data
}
