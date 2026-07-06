import api from '../lib/api'

export interface Coupon {
  _id: string
  code: string
  description: string
  type: 'fixed' | 'percentage'
  value: number
  maxDiscountAmount: number | null
  usageLimit: number | null
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableCourseIds: string[] | null
}

export async function validateCoupon(courseId: string, couponCode: string) {
  const { data } = await api.post('/coupons/validate', { courseId, couponCode })
  return data.data
}

export async function getAdminCoupons(params?: any) {
  const { data } = await api.get('/admin/coupons', { params })
  return { coupons: data.data.coupons, meta: data.data }
}

export async function createCoupon(coupon: Partial<Coupon>) {
  const { data } = await api.post('/admin/coupons', coupon)
  return data.data as Coupon
}

export async function updateCoupon(id: string, coupon: Partial<Coupon>) {
  const { data } = await api.put(`/admin/coupons/${id}`, coupon)
  return data.data as Coupon
}

export async function updateCouponStatus(id: string, isActive: boolean) {
  const { data } = await api.patch(`/admin/coupons/${id}/status`, { isActive })
  return data.data as Coupon
}

export async function deleteCoupon(id: string) {
  await api.delete(`/admin/coupons/${id}`)
}
