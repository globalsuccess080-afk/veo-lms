import { Types } from 'mongoose'
import { Coupon } from './coupon.model'
import { cache } from '../../utils/cache'
import { ApiError } from '../../utils/apiError'
import { Course } from '../course/course.model'
import { buildQuery } from '../../utils/queryBuilder'

export async function invalidateCache(code: string) {
  await cache.del(`coupon:${code.toUpperCase()}`)
}

export async function createCoupon(data: any) {
  const existing = await Coupon.findOne({ code: data.code.toUpperCase() })
  if (existing) throw new ApiError(409, 'Coupon code already exists')

  const coupon = await Coupon.create({ ...data, code: data.code.toUpperCase() })
  return coupon
}

export async function getCoupons(query: any) {
  const { filterQuery, skip, limit, sort, page } = buildQuery(query, ['code'])

  const [coupons, total] = await Promise.all([
    Coupon.find(filterQuery).sort(sort as any).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filterQuery)
  ])

  return {
    coupons: coupons.map(c => ({ ...c, id: c._id.toString() })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function getCouponById(id: string) {
  const coupon = await Coupon.findById(id)
  if (!coupon) throw new ApiError(404, 'Coupon not found')
  return coupon
}

export async function updateCoupon(id: string, data: any) {
  const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true })
  if (!coupon) throw new ApiError(404, 'Coupon not found')
  await invalidateCache(coupon.code)
  return coupon
}

export async function updateStatus(id: string, isActive: boolean) {
  const coupon = await Coupon.findByIdAndUpdate(id, { isActive }, { new: true })
  if (!coupon) throw new ApiError(404, 'Coupon not found')
  await invalidateCache(coupon.code)
  return coupon
}

export async function deleteCoupon(id: string) {
  const coupon = await Coupon.findByIdAndDelete(id)
  if (!coupon) throw new ApiError(404, 'Coupon not found')
  await invalidateCache(coupon.code)
}

export async function validateCoupon(code: string, courseId: string) {
  const normalizedCode = code.toUpperCase().trim()
  const key = `coupon:${normalizedCode}`

  const coupon: any = await cache.getOrSet(key, async () => {
    const dbCoupon = await Coupon.findOne({ code: normalizedCode }).lean()
    if (!dbCoupon) return null
    return dbCoupon
  }, 300)

  if (!coupon) throw new ApiError(404, 'Coupon not found')

  if (!coupon.isActive) throw new ApiError(400, 'Coupon is inactive')

  const now = new Date()
  if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
    throw new ApiError(400, 'Coupon is expired or not yet valid')
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached')
  }

  if (coupon.applicableCourses && coupon.applicableCourses.length > 0) {
    const isApplicable = coupon.applicableCourses.some((c: any) => c.toString() === courseId)
    if (!isApplicable) throw new ApiError(400, 'Coupon is not applicable for this course')
  }

  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')

  const originalAmount = course.price

  let discountAmount = 0
  if (coupon.type === 'fixed') {
    discountAmount = coupon.value
  } else if (coupon.type === 'percentage') {
    discountAmount = (originalAmount * coupon.value) / 100
  }

  if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
    discountAmount = coupon.maxDiscountAmount
  }

  if (discountAmount > originalAmount) {
    discountAmount = originalAmount
  }

  const finalAmount = originalAmount - discountAmount

  return {
    originalAmount,
    discountAmount,
    finalAmount,
    couponId: coupon._id
  }
}
