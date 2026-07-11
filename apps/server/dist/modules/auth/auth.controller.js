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
exports.resetPassword = exports.forgotPassword = exports.me = exports.logout = exports.refresh = exports.adminLogin = exports.login = exports.register = exports.sendOtp = void 0;
const shared_1 = require("@veolms/shared");
const authService = __importStar(require("./auth.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const env_1 = require("../../config/env");
const cookieOptions = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === 'production',
    sameSite: (env_1.env.NODE_ENV === 'production' ? 'none' : 'lax'),
    maxAge: 7 * 24 * 60 * 60 * 1000
};
function setRefreshCookie(res, token) {
    res.cookie('refreshToken', token, cookieOptions);
}
exports.sendOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email)
        return res.status(400).json({ success: false, message: 'Name and email are required' });
    const result = await authService.sendOtp(name, email);
    (0, apiResponse_1.sendSuccess)(res, result, result.message);
});
exports.register = [
    (0, validate_middleware_1.validate)(shared_1.registerSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { name, email, password, otp } = req.body;
        if (!otp)
            return res.status(400).json({ success: false, message: 'OTP is required' });
        const result = await authService.register(name, email, password, otp);
        setRefreshCookie(res, result.refreshToken);
        (0, apiResponse_1.sendSuccess)(res, { accessToken: result.accessToken, user: result.user }, 'Registered successfully', 201);
    })
];
exports.login = [
    (0, validate_middleware_1.validate)(shared_1.loginSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email, password } = req.body;
        const result = await authService.login(email, password, 'student');
        setRefreshCookie(res, result.refreshToken);
        (0, apiResponse_1.sendSuccess)(res, { accessToken: result.accessToken, user: result.user }, 'Logged in successfully');
    })
];
exports.adminLogin = [
    (0, validate_middleware_1.validate)(shared_1.loginSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email, password } = req.body;
        const result = await authService.login(email, password, 'admin');
        setRefreshCookie(res, result.refreshToken);
        (0, apiResponse_1.sendSuccess)(res, { accessToken: result.accessToken, user: result.user }, 'Welcome back, admin');
    })
];
exports.refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token)
        return res.status(401).json({ success: false, message: 'No refresh token' });
    const result = await authService.refresh(token);
    setRefreshCookie(res, result.refreshToken);
    (0, apiResponse_1.sendSuccess)(res, { accessToken: result.accessToken });
});
exports.logout = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await authService.logout(req.user.id);
        res.clearCookie('refreshToken');
        (0, apiResponse_1.sendSuccess)(res, null, 'Logged out');
    })
];
exports.me = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = await authService.getMe(req.user.id);
        (0, apiResponse_1.sendSuccess)(res, user);
    })
];
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ success: false, message: 'Email is required' });
    const result = await authService.forgotPassword(email);
    (0, apiResponse_1.sendSuccess)(res, result, result.message);
});
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
        return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    if (newPassword.length < 6)
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const result = await authService.resetPassword(email, otp, newPassword);
    (0, apiResponse_1.sendSuccess)(res, result, result.message);
});
