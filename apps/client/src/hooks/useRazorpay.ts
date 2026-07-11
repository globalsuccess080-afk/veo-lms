import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { confirmPayment, createOrder, getPaymentStatus } from '../services/payment.service'
import { toast } from 'sonner'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export function useRazorpay() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

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

  const pollStatus = useCallback(async (orderId: string) => {
    const startedAt = Date.now()
    while (Date.now() - startedAt < 120000) {
      const status = await getPaymentStatus(orderId)
      if (status.status === 'COMPLETED' && status.courseSlug) {
        toast.success("Payment confirmed. You're enrolled!")
        queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })
        navigate(`/learn/${status.courseSlug}`)
        return
      }
      if (status.status === 'FAILED' || status.status === 'REFUNDED') {
        toast.error('Payment could not be completed. Please contact support if money was deducted.')
        return
      }
      await new Promise(resolve => setTimeout(resolve, 2500))
    }
    toast.error('Payment confirmation is taking longer than expected. Please check My Courses shortly.')
  }, [navigate, queryClient])

  const initiatePayment = useCallback(async (courseId: string, couponCode?: string) => {
    if (loading) return
    setLoading(true)
    let order
    try {
      order = await createOrder(courseId, couponCode)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to create payment order')
      setLoading(false)
      return
    }

    if (order.free) {
      toast.success('Enrollment successful!')
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })
      navigate(`/learn/${order.courseSlug}`)
      setLoading(false)
      return
    }

    if (order.mock) {
      try {
        toast.success("Payment received successfully. We're confirming your payment...")
        await pollStatus(order.orderId)
      } catch {
        toast.error('Test payment failed')
      } finally {
        setLoading(false)
      }
      return
    }

    const loaded = await loadScript()
    if (!loaded) {
      toast.error('Payment gateway failed to load')
      setLoading(false)
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
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            toast.success("Payment received successfully. We're confirming your payment...")
            const confirmed = await confirmPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature)
            if (confirmed.courseSlug) {
              queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })
              navigate(`/learn/${confirmed.courseSlug}`)
              return
            }
            await pollStatus(order.orderId)
          } catch (e) {
            const err = e as { response?: { data?: { message?: string } } }
            toast.error(err.response?.data?.message || 'Payment confirmation failed')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => setLoading(false)
        },
        theme: { color: '#0891b2' }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      toast.error('Failed to create payment order')
      setLoading(false)
    }
  }, [loading, navigate, pollStatus, queryClient])

  return { initiatePayment, loading }
}
