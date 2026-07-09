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
exports.remove = exports.updateStatus = exports.update = exports.create = exports.getById = exports.getAll = exports.validate = void 0;
const couponService = __importStar(require("./coupon.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
exports.validate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { couponCode, courseId } = req.body;
    const result = await couponService.validateCoupon(couponCode, courseId);
    (0, apiResponse_1.sendSuccess)(res, result);
});
exports.getAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await couponService.getCoupons(req.query);
    (0, apiResponse_1.sendSuccess)(res, result);
});
exports.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const coupon = await couponService.getCouponById(String(req.params.id));
    (0, apiResponse_1.sendSuccess)(res, coupon);
});
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const coupon = await couponService.createCoupon(req.body);
    (0, apiResponse_1.sendSuccess)(res, coupon, 'Coupon created', 201);
});
exports.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const coupon = await couponService.updateCoupon(String(req.params.id), req.body);
    (0, apiResponse_1.sendSuccess)(res, coupon, 'Coupon updated');
});
exports.updateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const coupon = await couponService.updateStatus(String(req.params.id), req.body.isActive);
    (0, apiResponse_1.sendSuccess)(res, coupon, 'Coupon status updated');
});
exports.remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await couponService.deleteCoupon(String(req.params.id));
    (0, apiResponse_1.sendSuccess)(res, null, 'Coupon deleted');
});
