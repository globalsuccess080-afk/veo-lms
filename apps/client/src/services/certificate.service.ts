import api from '../lib/api'

export interface Certificate {
  _id: string
  certificateId: string
  courseId: { _id: string, title: string, slug: string }
  userId: { _id: string, name: string, email: string }
  progressPercentage: number
  pdfUrl: string
  issuedAt: string
  status: 'active' | 'revoked'
}

export async function generateCertificate(courseId: string) {
  const { data } = await api.post(`/certificates/generate/${courseId}`, {})
  return data
}

export async function getCourseCertificate(courseId: string): Promise<Certificate | null> {
  try {
    const { data } = await api.get(`/certificates/course/${courseId}`)
    return data.data
  } catch (err: any) {
    if (err.response?.status === 404) return null
    throw err
  }
}

export async function downloadCertificate(certificateId: string): Promise<string> {
  const { data } = await api.get(`/certificates/${certificateId}/download`)
  return data.data.url
}

export async function getPublicCertificate(certificateId: string): Promise<any> {
  const { data } = await api.get(`/certificates/public/${certificateId}`)
  return data.data
}

export async function getAdminCertificates(): Promise<Certificate[]> {
  const { data } = await api.get('/certificates/admin')
  return data.data
}

export async function revokeCertificate(certificateId: string): Promise<void> {
  await api.post(`/certificates/${certificateId}/revoke`, {})
}

export async function requestPdfDownload(certificateId: string): Promise<{ data: string }> {
  const { data } = await api.post(`/certificates/${certificateId}/download-request`, {})
  return data.data
}

export async function pollPdfJobStatus(jobId: string): Promise<{ status: string, data?: string }> {
  const { data } = await api.get(`/certificates/job/${jobId}`)
  return data.data
}
