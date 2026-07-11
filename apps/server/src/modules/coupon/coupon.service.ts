import { Types } from 'mongoose'
import { Coupon } from './coupon.model'
import { cache } from '../../utils/cache'
import { ApiError } from '../../utils/apiError'
import { Course } from '../course/course.model'
import { buildQuery } from '../../utils/queryBuilder'

export async function invalidateCache(code: string) {
  await cache.del(`coupon:${code.toUpperCase()}`)
}

function normalizeCouponPayload(data: any) {
  const applicableCourses = Array.isArray(data.applicableCourseIds)
    ? data.applicableCourseIds
    : data.applicableCourses

  const normalized = {
    ...data,
    applicableCourses: applicableCourses && applicableCourses.length > 0 ? applicableCourses : [],
  }

  delete normalized.applicableCourseIds
  return normalized
}

function formatCoupon(coupon: any) {
  const applicableCourses = Array.isArray(coupon.applicableCourses) ? coupon.applicableCourses : []
  return {
    ...coupon,
    id: coupon._id.toString(),
    applicableCourseIds: applicableCourses.map((course: any) => course?._id ? course._id.toString() : course.toString()),
    applicableCourses,
  }
}

export async function createCoupon(data: any) {
  const existing = await Coupon.findOne({ code: data.code.toUpperCase() })
  if (existing) throw new ApiError(409, 'Coupon code already exists')

  const coupon = await Coupon.create({ ...normalizeCouponPayload(data), code: data.code.toUpperCase() })
  return formatCoupon(await coupon.populate('applicableCourses', 'title slug'))
}

export async function getCoupons(query: any) {
  const { filterQuery, skip, limit, sort, page } = buildQuery(query, ['code'])

  const [coupons, total] = await Promise.all([
    Coupon.find(filterQuery).populate('applicableCourses', 'title slug').sort(sort as any).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filterQuery)
  ])

  return {
    coupons: coupons.map(formatCoupon),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function getCouponById(id: string) {
  const coupon = await Coupon.findById(id).populate('applicableCourses', 'title slug').lean()
  if (!coupon) throw new ApiError(404, 'Coupon not found')
  return formatCoupon(coupon)
}

export async function updateCoupon(id: string, data: any) {
  const coupon = await Coupon.findByIdAndUpdate(id, normalizeCouponPayload(data), { new: true }).populate('applicableCourses', 'title slug')
  if (!coupon) throw new ApiError(404, 'Coupon not found')
  await invalidateCache(coupon.code)
  return formatCoupon(coupon.toObject())
}

export async function updateStatus(id: string, isActive: boolean) {
  const coupon = await Coupon.findByIdAndUpdate(id, { isActive }, { new: true }).populate('applicableCourses', 'title slug')
  if (!coupon) throw new ApiError(404, 'Coupon not found')
  await invalidateCache(coupon.code)
  return formatCoupon(coupon.toObject())
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
