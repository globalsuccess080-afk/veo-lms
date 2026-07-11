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

export interface PaymentHistoryItem {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  courseName: string
  course: { id: string; title: string; slug: string; thumbnail?: string } | null
  orderId: string
  paymentId?: string | null
  originalAmount: number
  discountAmount: number
  finalAmount: number
  couponCode?: string | null
  createdAt: string
}

export async function getPaymentHistory(): Promise<PaymentHistoryItem[]> {
  const { data } = await api.get('/payments/history')
  return data.data
}
