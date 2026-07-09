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
exports.history = exports.confirmMock = exports.verify = exports.createOrder = void 0;
const shared_1 = require("@veolms/shared");
const paymentService = __importStar(require("./payment.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
exports.createOrder = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('student', 'admin'),
    (0, validate_middleware_1.validate)(shared_1.createOrderSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const order = await paymentService.createOrder(req.user.id, req.body.courseId, req.body.couponCode);
        (0, apiResponse_1.sendSuccess)(res, order);
    })
];
exports.verify = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('student', 'admin'),
    (0, validate_middleware_1.validate)(shared_1.verifyPaymentSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        const result = await paymentService.verifyPayment(req.user.id, razorpayOrderId, razorpayPaymentId, razorpaySignature);
        (0, apiResponse_1.sendSuccess)(res, result, 'Payment verified');
    })
];
exports.confirmMock = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('student', 'admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await paymentService.confirmMockPayment(req.user.id, req.body.orderId);
        (0, apiResponse_1.sendSuccess)(res, result, 'Payment completed (test mode)');
    })
];
exports.history = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const payments = await paymentService.getPaymentHistory(req.user.id);
        (0, apiResponse_1.sendSuccess)(res, payments);
    })
];
