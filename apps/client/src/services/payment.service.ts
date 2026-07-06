import api from '../lib/api'

export async function createOrder(courseId: string, couponCode?: string) {
  const { data } = await api.post('/payments/create-order', { courseId, couponCode })
  return data.data as { orderId: string; amount: number; currency: string; keyId: string; courseName: string; mock: boolean; free?: boolean; courseSlug?: string }
}

export async function verifyPayment(body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
  const { data } = await api.post('/payments/verify', body)
  return data.data as { courseSlug: string }
}

export async function confirmMockPayment(orderId: string) {
  const { data } = await api.post('/payments/confirm-mock', { orderId })
  return data.data as { courseSlug: string }
}
