import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { createOrder, verifyPayment, confirmMockPayment } from '../services/payment.service'
import { toast } from 'sonner'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export function useRazorpay() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loadScript = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const initiatePayment = useCallback(async (courseId: string, couponCode?: string) => {
    let order
    try {
      order = await createOrder(courseId, couponCode)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to create payment order')
      return
    }

    if (order.free) {
      toast.success('Enrollment successful!')
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })
      navigate(`/learn/${order.courseSlug}`)
      return
    }

    if (order.mock) {
      try {
        const result = await confirmMockPayment(order.orderId)
        toast.success('Enrollment successful (test mode)')
        queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })
        navigate(`/learn/${result.courseSlug}`)
      } catch {
        toast.error('Test payment failed')
      }
      return
    }

    const loaded = await loadScript()
    if (!loaded) {
      toast.error('Payment gateway failed to load')
      return
    }

    try {
      const options = {
        key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'VeoLMS',
        description: order.courseName,
        order_id: order.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const result = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
            toast.success('Enrollment successful!')
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })
            navigate(`/learn/${result.courseSlug}`)
          } catch {
            toast.error('Payment verification failed')
          }
        },
        theme: { color: '#6366f1' }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      toast.error('Failed to create payment order')
    }
  }, [navigate])

  return { initiatePayment, loading: false }
}
