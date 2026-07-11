"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENTS_MOCK = void 0;
exports.createOrder = createOrder;
exports.handleRazorpayWebhook = handleRazorpayWebhook;
exports.getPaymentStatus = getPaymentStatus;
exports.getPaymentHistory = getPaymentHistory;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("../../config/env");
const payment_model_1 = require("./payment.model");
const course_model_1 = require("../course/course.model");
const enrollment_service_1 = require("../enrollment/enrollment.service");
const coupon_model_1 = require("../coupon/coupon.model");
const coupon_service_1 = require("../coupon/coupon.service");
const notification_model_1 = require("../notification/notification.model");
const apiError_1 = require("../../utils/apiError");
const logger_1 = require("../../utils/logger");
const assetPath_1 = require("../../utils/assetPath");
exports.PAYMENTS_MOCK = !env_1.env.RAZORPAY_KEY_ID ||
    !env_1.env.RAZORPAY_KEY_SECRET ||
    env_1.env.RAZORPAY_KEY_ID.endsWith('_xxx') ||
    env_1.env.RAZORPAY_KEY_SECRET === 'xxx';
const razorpay = exports.PAYMENTS_MOCK
    ? null
    : new razorpay_1.default({ key_id: env_1.env.RAZORPAY_KEY_ID, key_secret: env_1.env.RAZORPAY_KEY_SECRET });
function normalizeStatus(status) {
    if (status === 'paid')
        return 'COMPLETED';
    if (status === 'created')
        return 'PENDING';
    if (status === 'failed')
        return 'FAILED';
    if (status === 'refunded')
        return 'REFUNDED';
    return status;
}
function verifyWebhookSignature(rawBody, signature) {
    if (!env_1.env.RAZORPAY_WEBHOOK_SECRET)
        throw new apiError_1.ApiError(500, 'Razorpay webhook secret is not configured');
    if (!signature)
        throw new apiError_1.ApiError(400, 'Missing Razorpay webhook signature');
    const expected = crypto_1.default.createHmac('sha256', env_1.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    if (expectedBuffer.length !== signatureBuffer.length)
        return false;
    return crypto_1.default.timingSafeEqual(expectedBuffer, signatureBuffer);
}
async function finalizeEnrollment(userId, payment, session) {
    const course = await course_model_1.Course.findById(payment.courseId).session(session || null);
    await (0, enrollment_service_1.createEnrollment)(userId, payment.courseId.toString(), payment._id.toString(), session);
    if (payment.couponId) {
        const existingUsage = await coupon_model_1.CouponUsage.findOne({ paymentId: payment._id }).session(session || null);
        if (!existingUsage) {
            const coupon = await coupon_model_1.Coupon.findByIdAndUpdate(payment.couponId, { $inc: { usedCount: 1 } }, { new: true, session });
            if (coupon) {
                await coupon_model_1.CouponUsage.create([{
                        couponId: coupon._id,
                        userId,
                        courseId: payment.courseId,
                        paymentId: payment._id,
                        couponCode: payment.couponCode,
                        discountAmount: payment.discountAmount
                    }], { session });
            }
        }
    }
    await notification_model_1.Notification.create([{
            userId,
            type: 'enrollment',
            title: 'Enrollment Successful',
            message: `You are now enrolled in ${course?.title}`,
            link: `/learn/${course?.slug}`
        }], { session });
    const { User } = await Promise.resolve().then(() => __importStar(require('../user/user.model')));
    const user = await User.findById(userId).session(session || null);
    if (user && course && payment.amount > 0) {
        const { emailQueue } = await Promise.resolve().then(() => __importStar(require('../email/email.queue')));
        const { generatePaymentEmail } = await Promise.resolve().then(() => __importStar(require('../email/templates')));
        await emailQueue.add('sendEmail', {
            to: user.getDecryptedEmail(),
            subject: `Payment Receipt: ${course.title}`,
            html: generatePaymentEmail(user.name, payment.amount, course.title, payment.razorpayOrderId)
        });
    }
    return { courseSlug: course?.slug };
}
async function createOrder(userId, courseId, couponCode) {
    logger_1.logger.debug(`[createOrder] Received couponCode: "${couponCode}" for course: ${courseId}`);
    const course = await course_model_1.Course.findById(courseId);
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    if (!course.isPublished)
        throw new apiError_1.ApiError(400, 'Course not available');
    const existing = await payment_model_1.Payment.findOne({ userId, courseId, status: { $in: ['COMPLETED', 'paid'] } });
    if (existing)
        throw new apiError_1.ApiError(409, 'Already enrolled in this course');
    let originalAmount = course.price;
    let finalAmount = course.price;
    let discountAmount = 0;
    let couponId = null;
    let appliedCouponCode = null;
    if (couponCode) {
        const validResult = await (0, coupon_service_1.validateCoupon)(couponCode, courseId);
        finalAmount = validResult.finalAmount;
        discountAmount = validResult.discountAmount;
        couponId = validResult.couponId;
        appliedCouponCode = couponCode.toUpperCase().trim();
    }
    const amount = Math.round(finalAmount * 100);
    logger_1.logger.debug(`[createOrder] originalAmount: ${originalAmount}, finalAmount: ${finalAmount}, amount (paise): ${amount}`);
    let orderId = `mock_order_${crypto_1.default.randomBytes(8).toString('hex')}`;
    if (!exports.PAYMENTS_MOCK) {
        if (amount > 0) {
            try {
                logger_1.logger.debug(`[createOrder] Calling Razorpay with amount: ${amount}`);
                const receiptId = `rcpt_${crypto_1.default.randomBytes(8).toString('hex')}`;
                const rzpOrder = await razorpay?.orders.create({ amount, currency: 'INR', receipt: receiptId });
                if (rzpOrder) {
                    orderId = rzpOrder.id;
                    logger_1.logger.debug(`[createOrder] Razorpay order created: ${orderId}`);
                }
            }
            catch (err) {
                console.error(`[createOrder Debug] Razorpay orders.create ERROR:`, err);
                throw new apiError_1.ApiError(500, `Razorpay error: ${err?.message || 'Unknown payment gateway error'}`);
            }
        }
        else {
            orderId = `free_order_${crypto_1.default.randomBytes(8).toString('hex')}`;
            logger_1.logger.debug(`[createOrder] Free order generated: ${orderId}`);
        }
    }
    await payment_model_1.Payment.create({
        userId,
        courseId,
        razorpayOrderId: orderId,
        amount,
        originalAmount,
        discountAmount,
        finalAmount,
        couponId,
        couponCode: appliedCouponCode,
        status: amount > 0 ? 'PENDING' : 'COMPLETED',
        metadata: { courseName: course.title, coursePrice: course.price }
    });
    if (amount === 0) {
        const payment = await payment_model_1.Payment.findOne({ razorpayOrderId: orderId });
        const result = await finalizeEnrollment(userId, payment);
        return {
            orderId, amount, currency: 'INR', keyId: env_1.env.RAZORPAY_KEY_ID,
            courseName: course.title, mock: false, free: true, courseSlug: result.courseSlug
        };
    }
    if (exports.PAYMENTS_MOCK) {
        const payment = await payment_model_1.Payment.findOne({ razorpayOrderId: orderId });
        if (payment) {
            payment.razorpayPaymentId = `mock_pay_${crypto_1.default.randomBytes(8).toString('hex')}`;
            payment.status = 'COMPLETED';
            await payment.save();
            const result = await finalizeEnrollment(userId, payment);
            return {
                orderId, amount, currency: 'INR', keyId: env_1.env.RAZORPAY_KEY_ID,
                courseName: course.title, mock: true, courseSlug: result.courseSlug
            };
        }
    }
    return {
        orderId,
        amount,
        currency: 'INR',
        keyId: env_1.env.RAZORPAY_KEY_ID,
        courseName: course.title,
        mock: exports.PAYMENTS_MOCK
    };
}
async function completeCapturedPayment(orderId, paymentId) {
    if (!razorpay)
        throw new apiError_1.ApiError(400, 'Razorpay is not configured');
    const gatewayPayment = await razorpay.payments.fetch(paymentId);
    if (!gatewayPayment || gatewayPayment.status !== 'captured')
        throw new apiError_1.ApiError(400, 'Payment is not captured');
    if (gatewayPayment.order_id !== orderId)
        throw new apiError_1.ApiError(400, 'Payment order mismatch');
    const session = await mongoose_1.default.startSession();
    try {
        let result = {};
        await session.withTransaction(async () => {
            const payment = await payment_model_1.Payment.findOne({ razorpayOrderId: orderId }).session(session);
            if (!payment)
                throw new apiError_1.ApiError(404, 'Payment not found');
            const status = normalizeStatus(payment.status);
            if (status === 'COMPLETED') {
                const course = await course_model_1.Course.findById(payment.courseId).session(session);
                result = { courseSlug: course?.slug };
                return;
            }
            if (gatewayPayment.amount !== payment.amount || gatewayPayment.currency !== payment.currency) {
                payment.status = 'FAILED';
                await payment.save({ session });
                throw new apiError_1.ApiError(400, 'Payment amount or currency mismatch');
            }
            payment.razorpayPaymentId = paymentId;
            payment.status = 'PROCESSING';
            await payment.save({ session });
            result = await finalizeEnrollment(payment.userId.toString(), payment, session);
            payment.status = 'COMPLETED';
            await payment.save({ session });
        });
        return result;
    }
    finally {
        await session.endSession();
    }
}
async function markPaymentFailed(orderId, paymentId) {
    const payment = await payment_model_1.Payment.findOne({ razorpayOrderId: orderId });
    if (!payment)
        return;
    if (normalizeStatus(payment.status) === 'COMPLETED')
        return;
    if (paymentId)
        payment.razorpayPaymentId = paymentId;
    payment.status = 'FAILED';
    await payment.save();
}
async function markPaymentRefunded(orderId) {
    const payment = await payment_model_1.Payment.findOne({ razorpayOrderId: orderId });
    if (!payment)
        return;
    payment.status = 'REFUNDED';
    await payment.save();
}
async function handleRazorpayWebhook(rawBody, signature) {
    if (!verifyWebhookSignature(rawBody, signature))
        throw new apiError_1.ApiError(400, 'Invalid Razorpay webhook signature');
    const event = JSON.parse(rawBody.toString('utf8'));
    const paymentEntity = event.payload?.payment?.entity;
    const refundEntity = event.payload?.refund?.entity;
    if (event.event === 'payment.captured' && paymentEntity?.id && paymentEntity?.order_id) {
        await completeCapturedPayment(paymentEntity.order_id, paymentEntity.id);
    }
    if (event.event === 'payment.failed' && paymentEntity?.order_id) {
        await markPaymentFailed(paymentEntity.order_id, paymentEntity.id);
    }
    if (event.event === 'refund.processed' && refundEntity?.payment_id && razorpay) {
        const gatewayPayment = await razorpay.payments.fetch(refundEntity.payment_id);
        if (gatewayPayment?.order_id)
            await markPaymentRefunded(gatewayPayment.order_id);
    }
    return { received: true };
}
async function getPaymentStatus(userId, orderId) {
    const payment = await payment_model_1.Payment.findOne({ razorpayOrderId: orderId });
    if (!payment)
        throw new apiError_1.ApiError(404, 'Payment not found');
    if (payment.userId.toString() !== userId)
        throw new apiError_1.ApiError(403, 'Unauthorized');
    const course = normalizeStatus(payment.status) === 'COMPLETED'
        ? await course_model_1.Course.findById(payment.courseId)
        : null;
    return {
        orderId,
        status: normalizeStatus(payment.status),
        courseSlug: course?.slug || null
    };
}
async function getPaymentHistory(userId) {
    const payments = await payment_model_1.Payment.find({ userId })
        .populate('courseId', 'title slug thumbnail')
        .sort({ createdAt: -1 })
        .lean();
    return payments.map(p => ({
        id: p._id.toString(),
        amount: p.amount,
        currency: p.currency,
        status: normalizeStatus(p.status),
        courseName: p.metadata.courseName,
        course: p.courseId && typeof p.courseId === 'object'
            ? {
                id: p.courseId._id?.toString(),
                title: p.courseId.title,
                slug: p.courseId.slug,
                thumbnail: p.courseId.thumbnail ? (0, assetPath_1.formatAssetPath)(p.courseId.thumbnail) : p.courseId.thumbnail,
            }
            : null,
        orderId: p.razorpayOrderId,
        paymentId: p.razorpayPaymentId,
        originalAmount: p.originalAmount,
        discountAmount: p.discountAmount,
        finalAmount: p.finalAmount,
        couponCode: p.couponCode,
        createdAt: p.createdAt.toISOString()
    }));
}
