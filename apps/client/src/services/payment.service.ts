import api from '../lib/api'

export async function createOrder(courseId: string, couponCode?: string) {
  const { data } = await api.post('/payments/create-order', { courseId, couponCode })
  return data.data as { orderId: string; amount: number; currency: string; keyId: string; courseName: string; mock: boolean; free?: boolean; courseSlug?: string }
}

export async function getPaymentStatus(orderId: string) {
  const { data } = await api.get(`/payments/status/${orderId}`)
  return data.data as {
    orderId: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
    courseSlug: string | null
  }
}
