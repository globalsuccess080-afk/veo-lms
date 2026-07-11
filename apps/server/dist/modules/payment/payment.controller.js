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
exports.history = exports.webhook = exports.confirm = exports.status = exports.createOrder = void 0;
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
exports.status = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('student', 'admin'),
    (0, validate_middleware_1.validate)(shared_1.paymentStatusParamsSchema, 'params'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        res.set('Cache-Control', 'private, no-store, max-age=0');
        const { orderId } = req.params;
        const result = await paymentService.getPaymentStatus(req.user.id, orderId);
        (0, apiResponse_1.sendSuccess)(res, result);
    })
];
exports.confirm = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('student', 'admin'),
    (0, validate_middleware_1.validate)(shared_1.confirmPaymentSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        res.set('Cache-Control', 'private, no-store, max-age=0');
        const { orderId, paymentId, signature } = req.body;
        const result = await paymentService.confirmPayment(req.user.id, orderId, paymentId, signature);
        (0, apiResponse_1.sendSuccess)(res, result, 'Payment confirmed');
    })
];
exports.webhook = [
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        res.set('Cache-Control', 'no-store');
        const signature = req.headers['x-razorpay-signature'];
        const result = await paymentService.handleRazorpayWebhook(req.body, Array.isArray(signature) ? signature[0] : signature);
        (0, apiResponse_1.sendSuccess)(res, result);
    })
];
exports.history = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const payments = await paymentService.getPaymentHistory(req.user.id);
        (0, apiResponse_1.sendSuccess)(res, payments);
    })
];
