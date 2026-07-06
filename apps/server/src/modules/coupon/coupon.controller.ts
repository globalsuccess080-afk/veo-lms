import * as couponService from './coupon.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'

export const validate = asyncHandler(async (req, res) => {
  const { couponCode, courseId } = req.body
  const result = await couponService.validateCoupon(couponCode, courseId)
  sendSuccess(res, result)
})

export const getAll = asyncHandler(async (req, res) => {
  const result = await couponService.getCoupons(req.query)
  sendSuccess(res, result)
})

export const getById = asyncHandler(async (req, res) => {
  const coupon = await couponService.getCouponById(String(req.params.id))
  sendSuccess(res, coupon)
})

export const create = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body)
  sendSuccess(res, coupon, 'Coupon created', 201)
})

export const update = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(String(req.params.id), req.body)
  sendSuccess(res, coupon, 'Coupon updated')
})

export const updateStatus = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateStatus(String(req.params.id), req.body.isActive)
  sendSuccess(res, coupon, 'Coupon status updated')
})

export const remove = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(String(req.params.id))
  sendSuccess(res, null, 'Coupon deleted')
})
