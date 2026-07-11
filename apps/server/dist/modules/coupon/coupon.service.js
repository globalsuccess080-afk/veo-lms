"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = invalidateCache;
exports.createCoupon = createCoupon;
exports.getCoupons = getCoupons;
exports.getCouponById = getCouponById;
exports.updateCoupon = updateCoupon;
exports.updateStatus = updateStatus;
exports.deleteCoupon = deleteCoupon;
exports.validateCoupon = validateCoupon;
const coupon_model_1 = require("./coupon.model");
const cache_1 = require("../../utils/cache");
const apiError_1 = require("../../utils/apiError");
const course_model_1 = require("../course/course.model");
const queryBuilder_1 = require("../../utils/queryBuilder");
async function invalidateCache(code) {
    await cache_1.cache.del(`coupon:${code.toUpperCase()}`);
}
function normalizeCouponPayload(data) {
    const applicableCourses = Array.isArray(data.applicableCourseIds)
        ? data.applicableCourseIds
        : data.applicableCourses;
    const normalized = {
        ...data,
        applicableCourses: applicableCourses && applicableCourses.length > 0 ? applicableCourses : [],
    };
    delete normalized.applicableCourseIds;
    return normalized;
}
function formatCoupon(coupon) {
    const applicableCourses = Array.isArray(coupon.applicableCourses) ? coupon.applicableCourses : [];
    return {
        ...coupon,
        id: coupon._id.toString(),
        applicableCourseIds: applicableCourses.map((course) => course?._id ? course._id.toString() : course.toString()),
        applicableCourses,
    };
}
async function createCoupon(data) {
    const existing = await coupon_model_1.Coupon.findOne({ code: data.code.toUpperCase() });
    if (existing)
        throw new apiError_1.ApiError(409, 'Coupon code already exists');
    const coupon = await coupon_model_1.Coupon.create({ ...normalizeCouponPayload(data), code: data.code.toUpperCase() });
    return formatCoupon(await coupon.populate('applicableCourses', 'title slug'));
}
async function getCoupons(query) {
    const { filterQuery, skip, limit, sort, page } = (0, queryBuilder_1.buildQuery)(query, ['code']);
    const [coupons, total] = await Promise.all([
        coupon_model_1.Coupon.find(filterQuery).populate('applicableCourses', 'title slug').sort(sort).skip(skip).limit(limit).lean(),
        coupon_model_1.Coupon.countDocuments(filterQuery)
    ]);
    return {
        coupons: coupons.map(formatCoupon),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}
async function getCouponById(id) {
    const coupon = await coupon_model_1.Coupon.findById(id).populate('applicableCourses', 'title slug').lean();
    if (!coupon)
        throw new apiError_1.ApiError(404, 'Coupon not found');
    return formatCoupon(coupon);
}
async function updateCoupon(id, data) {
    const coupon = await coupon_model_1.Coupon.findByIdAndUpdate(id, normalizeCouponPayload(data), { new: true }).populate('applicableCourses', 'title slug');
    if (!coupon)
        throw new apiError_1.ApiError(404, 'Coupon not found');
    await invalidateCache(coupon.code);
    return formatCoupon(coupon.toObject());
}
async function updateStatus(id, isActive) {
    const coupon = await coupon_model_1.Coupon.findByIdAndUpdate(id, { isActive }, { new: true }).populate('applicableCourses', 'title slug');
    if (!coupon)
        throw new apiError_1.ApiError(404, 'Coupon not found');
    await invalidateCache(coupon.code);
    return formatCoupon(coupon.toObject());
}
async function deleteCoupon(id) {
    const coupon = await coupon_model_1.Coupon.findByIdAndDelete(id);
    if (!coupon)
        throw new apiError_1.ApiError(404, 'Coupon not found');
    await invalidateCache(coupon.code);
}
async function validateCoupon(code, courseId) {
    const normalizedCode = code.toUpperCase().trim();
    const key = `coupon:${normalizedCode}`;
    const coupon = await cache_1.cache.getOrSet(key, async () => {
        const dbCoupon = await coupon_model_1.Coupon.findOne({ code: normalizedCode }).lean();
        if (!dbCoupon)
            return null;
        return dbCoupon;
    }, 300);
    if (!coupon)
        throw new apiError_1.ApiError(404, 'Coupon not found');
    if (!coupon.isActive)
        throw new apiError_1.ApiError(400, 'Coupon is inactive');
    const now = new Date();
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
        throw new apiError_1.ApiError(400, 'Coupon is expired or not yet valid');
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new apiError_1.ApiError(400, 'Coupon usage limit reached');
    }
    if (coupon.applicableCourses && coupon.applicableCourses.length > 0) {
        const isApplicable = coupon.applicableCourses.some((c) => c.toString() === courseId);
        if (!isApplicable)
            throw new apiError_1.ApiError(400, 'Coupon is not applicable for this course');
    }
    const course = await course_model_1.Course.findById(courseId);
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    const originalAmount = course.price;
    let discountAmount = 0;
    if (coupon.type === 'fixed') {
        discountAmount = coupon.value;
    }
    else if (coupon.type === 'percentage') {
        discountAmount = (originalAmount * coupon.value) / 100;
    }
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
    }
    if (discountAmount > originalAmount) {
        discountAmount = originalAmount;
    }
    const finalAmount = originalAmount - discountAmount;
    return {
        originalAmount,
        discountAmount,
        finalAmount,
        couponId: coupon._id
    };
}
