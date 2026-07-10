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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponUsage = exports.Coupon = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const couponSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    applicableCourses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Course' }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
const couponUsageSchema = new mongoose_1.Schema({
    couponId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', required: true },
    paymentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Payment', required: true },
    couponCode: { type: String, required: true },
    discountAmount: { type: Number, required: true },
    redeemedAt: { type: Date, default: Date.now }
});
couponUsageSchema.index({ couponId: 1 });
couponUsageSchema.index({ userId: 1 });
couponUsageSchema.index({ courseId: 1 });
couponUsageSchema.index({ paymentId: 1 }, { unique: true });
exports.Coupon = mongoose_1.default.model('Coupon', couponSchema);
exports.CouponUsage = mongoose_1.default.model('CouponUsage', couponUsageSchema);
