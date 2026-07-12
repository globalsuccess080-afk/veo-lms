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
exports.sendOtp = sendOtp;
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.getMe = getMe;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const encryption_1 = require("../../utils/encryption");
const user_model_1 = require("../user/user.model");
const apiError_1 = require("../../utils/apiError");
const generateToken_1 = require("../../utils/generateToken");
const redis_1 = require("../../config/redis");
const assetPath_1 = require("../../utils/assetPath");
const logger_1 = require("../../utils/logger");
const password_1 = require("../../utils/password");
let emailDepsPromise = null;
function getEmailDeps() {
    emailDepsPromise ||= Promise.all([
        Promise.resolve().then(() => __importStar(require('../email/email.queue'))),
        Promise.resolve().then(() => __importStar(require('../email/templates')))
    ]).then(([queueModule, templateModule]) => ({
        emailQueue: queueModule.emailQueue,
        generateOtpEmail: templateModule.generateOtpEmail,
        generateWelcomeEmail: templateModule.generateWelcomeEmail,
        generatePasswordResetEmail: templateModule.generatePasswordResetEmail
    }));
    return emailDepsPromise;
}
function formatUser(user) {
    return {
        id: user._id.toString(),
        name: user.getDecryptedName(),
        email: user.getDecryptedEmail(),
        role: user.role,
        avatar: user.avatar ? (0, assetPath_1.formatAssetPath)(user.avatar) : user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString()
    };
}
async function sendOtp(name, email) {
    const normalizedEmail = email.trim().toLowerCase();
    logger_1.logger.info('OTP requested', { email: normalizedEmail, name });
    const depsPromise = getEmailDeps();
    const existing = await user_model_1.User.exists({ emailHash: (0, encryption_1.hashEmail)(normalizedEmail) });
    if (existing)
        throw new apiError_1.ApiError(409, 'Email already registered');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis_1.redis.set(`otp:${normalizedEmail}`, otp, 'EX', 10 * 60);
    logger_1.logger.info('OTP stored in redis', { email: normalizedEmail, key: `otp:${normalizedEmail}`, expiresInSeconds: 600 });
    const { emailQueue, generateOtpEmail } = await depsPromise;
    const job = await emailQueue.add('sendEmail', {
        to: normalizedEmail,
        subject: 'Verify your VeoLMS Account',
        html: generateOtpEmail(name, otp)
    });
    logger_1.logger.info('OTP email job queued', {
        email: normalizedEmail,
        jobId: job.id,
        queueName: job.queueName,
    });
    return { message: 'OTP sent to email' };
}
async function register(name, email, password, otp) {
    const normalizedEmail = email.trim().toLowerCase();
    const storedOtp = await redis_1.redis.get(`otp:${normalizedEmail}`);
    if (!storedOtp || storedOtp !== otp) {
        throw new apiError_1.ApiError(400, 'The OTP is incorrect or has expired. Please check the code or request a new OTP.');
    }
    const existing = await user_model_1.User.exists({ emailHash: (0, encryption_1.hashEmail)(normalizedEmail) });
    if (existing)
        throw new apiError_1.ApiError(409, 'Email already registered');
    const hashed = await (0, password_1.hashPassword)(password);
    const user = await user_model_1.User.create({ name, email: normalizedEmail, password: hashed, role: 'student' });
    await redis_1.redis.del(`otp:${normalizedEmail}`);
    const { emailQueue, generateWelcomeEmail } = await getEmailDeps();
    await emailQueue.add('sendEmail', {
        to: normalizedEmail,
        subject: 'Welcome to VeoLMS',
        html: generateWelcomeEmail(name)
    });
    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = (0, generateToken_1.generateAccessToken)(payload);
    const refreshToken = (0, generateToken_1.generateRefreshToken)(payload);
    await redis_1.redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    return { accessToken, refreshToken, user: formatUser(user) };
}
async function handleFailedLogin(identifier) {
    const attemptsKey = `login_attempts:${identifier}`;
    const lockKey = `login_lock:${identifier}`;
    const attempts = await redis_1.redis.incr(attemptsKey);
    if (attempts === 1) {
        await redis_1.redis.expire(attemptsKey, 15 * 60); // 15 minutes window
    }
    if (attempts >= 5) {
        await redis_1.redis.set(lockKey, '1', 'EX', 15 * 60); // Lock for 15 minutes
        await redis_1.redis.del(attemptsKey);
    }
}
async function login(email, password, requiredRole) {
    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = (0, encryption_1.hashEmail)(normalizedEmail);
    const [emailLockTtl, user] = await Promise.all([
        redis_1.redis.ttl(`login_lock:${normalizedEmail}`),
        user_model_1.User.findOne({ emailHash })
    ]);
    let ttl = emailLockTtl;
    if (user) {
        const userTtl = await redis_1.redis.ttl(`login_lock:${user._id}`);
        ttl = Math.max(ttl, userTtl);
    }
    if (ttl > 0) {
        const minutes = Math.ceil(ttl / 60);
        throw new apiError_1.ApiError(403, `Account temporarily locked due to too many failed attempts. Try again in ${minutes} minute(s).`);
    }
    if (!user || !user.isActive) {
        await handleFailedLogin(normalizedEmail);
        throw new apiError_1.ApiError(401, 'The email or password you entered is incorrect.');
    }
    const valid = await (0, password_1.verifyPassword)(password, user.password);
    if (!valid) {
        await Promise.all([
            handleFailedLogin(normalizedEmail),
            handleFailedLogin(user._id.toString())
        ]);
        throw new apiError_1.ApiError(401, 'The email or password you entered is incorrect.');
    }
    if (requiredRole && user.role !== requiredRole) {
        throw new apiError_1.ApiError(403, 'You do not have access to this portal');
    }
    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = (0, generateToken_1.generateAccessToken)(payload);
    const refreshToken = (0, generateToken_1.generateRefreshToken)(payload);
    await redis_1.redis.set(`refresh:${user._id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    void Promise.all([
        redis_1.redis.del(`login_attempts:${normalizedEmail}`),
        redis_1.redis.del(`login_attempts:${user._id.toString()}`),
        user_model_1.User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } })
    ]).catch(() => undefined);
    if ((0, password_1.passwordNeedsRehash)(user.password)) {
        void (0, password_1.hashPassword)(password)
            .then((hashed) => user_model_1.User.updateOne({ _id: user._id }, { $set: { password: hashed } }))
            .catch(() => undefined);
    }
    return { accessToken, refreshToken, user: formatUser(user) };
}
async function refresh(refreshToken) {
    const { verifyRefreshToken } = await Promise.resolve().then(() => __importStar(require('../../utils/generateToken')));
    const decoded = verifyRefreshToken(refreshToken);
    const stored = await redis_1.redis.get(`refresh:${decoded.id}`);
    if (!stored || stored !== refreshToken)
        throw new apiError_1.ApiError(401, 'Invalid refresh token');
    const payload = { id: decoded.id, role: decoded.role };
    const newRefresh = (0, generateToken_1.generateRefreshToken)(payload);
    await redis_1.redis.set(`refresh:${payload.id}`, newRefresh, 'EX', 7 * 24 * 60 * 60);
    const accessToken = (0, generateToken_1.generateAccessToken)(payload);
    return { accessToken, refreshToken: newRefresh };
}
async function logout(userId) {
    await redis_1.redis.del(`refresh:${userId}`);
}
async function getMe(userId) {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new apiError_1.ApiError(404, 'User not found');
    return formatUser(user);
}
async function forgotPassword(email) {
    const normalizedEmail = email.trim().toLowerCase();
    logger_1.logger.info('Password reset OTP requested', { email: normalizedEmail });
    const user = await user_model_1.User.findOne({ emailHash: (0, encryption_1.hashEmail)(normalizedEmail) });
    if (!user)
        throw new apiError_1.ApiError(404, 'User not found');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis_1.redis.set(`reset_otp:${normalizedEmail}`, otp, 'EX', 10 * 60);
    logger_1.logger.info('Password reset OTP stored in redis', { email: normalizedEmail, key: `reset_otp:${normalizedEmail}`, expiresInSeconds: 600 });
    const { emailQueue, generatePasswordResetEmail } = await getEmailDeps();
    const job = await emailQueue.add('sendEmail', {
        to: normalizedEmail,
        subject: 'Reset Your VeoLMS Password',
        html: generatePasswordResetEmail(user.getDecryptedName(), otp)
    });
    logger_1.logger.info('Password reset email job queued', {
        email: normalizedEmail,
        jobId: job.id,
        queueName: job.queueName,
    });
    return { message: 'Password reset OTP sent to email' };
}
async function resetPassword(email, otp, newPassword) {
    const normalizedEmail = email.trim().toLowerCase();
    const storedOtp = await redis_1.redis.get(`reset_otp:${normalizedEmail}`);
    if (!storedOtp || storedOtp !== otp) {
        throw new apiError_1.ApiError(400, 'The OTP is incorrect or has expired. Please check the code or request a new OTP.');
    }
    const user = await user_model_1.User.findOne({ emailHash: (0, encryption_1.hashEmail)(normalizedEmail) });
    if (!user)
        throw new apiError_1.ApiError(404, 'User not found');
    const hashed = await (0, password_1.hashPassword)(newPassword);
    user.password = hashed;
    await user.save();
    await redis_1.redis.del(`reset_otp:${normalizedEmail}`);
    await redis_1.redis.del(`login_attempts:${normalizedEmail}`);
    await redis_1.redis.del(`login_lock:${normalizedEmail}`);
    await redis_1.redis.del(`login_attempts:${user._id.toString()}`);
    await redis_1.redis.del(`login_lock:${user._id.toString()}`);
    return { message: 'Password reset successfully' };
}
