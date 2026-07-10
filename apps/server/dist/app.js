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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const encryption_middleware_1 = require("./crypto/encryption.middleware");
const encryption_router_1 = __importDefault(require("./modules/encryption/encryption.router"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("./config/redis");
const security_1 = require("./config/security");
const auth_router_1 = __importDefault(require("./modules/auth/auth.router"));
const user_router_1 = __importDefault(require("./modules/user/user.router"));
const course_router_1 = __importDefault(require("./modules/course/course.router"));
const lesson_router_1 = __importDefault(require("./modules/lesson/lesson.router"));
const enrollment_router_1 = __importDefault(require("./modules/enrollment/enrollment.router"));
const payment_router_1 = __importDefault(require("./modules/payment/payment.router"));
const paymentController = __importStar(require("./modules/payment/payment.controller"));
const progress_router_1 = __importDefault(require("./modules/progress/progress.router"));
const admin_router_1 = __importDefault(require("./modules/admin/admin.router"));
const notification_router_1 = __importDefault(require("./modules/notification/notification.router"));
const video_router_1 = __importDefault(require("./modules/video/video.router"));
const note_router_1 = __importDefault(require("./modules/note/note.router"));
const discussion_router_1 = __importDefault(require("./modules/discussion/discussion.router"));
const coupon_router_1 = __importDefault(require("./modules/coupon/coupon.router"));
const streak_router_1 = __importDefault(require("./modules/streak/streak.router"));
const certificate_router_1 = __importDefault(require("./modules/certificate/certificate.router"));
const analytics_router_1 = __importDefault(require("./modules/analytics/analytics.router"));
const app = (0, express_1.default)();
// Production runs behind a single reverse proxy/load balancer, so trust one hop
// for correct client IP detection in express-rate-limit and secure cookies.
app.set('trust proxy', env_1.env.NODE_ENV === 'production' ? 1 : false);
async function getHealthStatus() {
    const workerHeartbeat = await redis_1.redis.get('health:worker:main');
    return {
        server: true,
        serviceRole: process.env.SERVICE_ROLE || 'server',
        mongoDB: mongoose_1.default.connection.readyState === 1,
        redis: redis_1.redis.status === 'ready',
        worker: Boolean(workerHeartbeat),
        workerHeartbeatKey: 'health:worker:main',
        workerHeartbeat,
    };
}
const connectSrc = [
    "'self'",
    ...security_1.allowedFrontendOrigins,
    "https://api.razorpay.com",
    env_1.env.R2_PUBLIC_URL,
];
if (env_1.env.NODE_ENV === 'development') {
    connectSrc.push("http://localhost:5173", "http://localhost:5000");
}
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc,
            imgSrc: ["'self'", "data:", env_1.env.R2_PUBLIC_URL],
            mediaSrc: ["'self'", env_1.env.R2_PUBLIC_URL],
            frameSrc: ["https://api.razorpay.com", "https://checkout.razorpay.com"],
        }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
const allowedOrigins = env_1.env.NODE_ENV === 'production'
    ? security_1.allowedFrontendOrigins
    : ['http://localhost:5173', 'http://127.0.0.1:5173', security_1.primaryFrontendOrigin];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (env_1.env.NODE_ENV === 'production' && (0, security_1.isAllowedFrontendOrigin)(origin)) {
            callback(null, true);
        }
        else if (env_1.env.NODE_ENV !== 'production' && (!origin || allowedOrigins.includes(origin))) {
            callback(null, true);
        }
        else if (env_1.env.NODE_ENV === 'development' && origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
            callback(null, true);
        }
        else {
            console.error(`Blocked by CORS. Origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('dev'));
app.post('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }), ...paymentController.webhook);
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use(encryption_middleware_1.globalEncryptionMiddleware);
app.use('/api', rateLimiter_1.apiLimiter);
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.swaggerSpec);
});
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, swagger_1.swaggerUiOptions));
app.get('/health', async (_req, res) => {
    res.json(await getHealthStatus());
});
app.get('/api/health', async (_req, res) => {
    res.json(await getHealthStatus());
});
app.use('/api/encryption', encryption_router_1.default);
app.use('/api/auth', auth_router_1.default);
app.use('/api/users', user_router_1.default);
app.use('/api/courses', course_router_1.default);
app.use('/api/lessons', lesson_router_1.default);
app.use('/api/enrollments', enrollment_router_1.default);
app.use('/api/payments', payment_router_1.default);
app.use('/api/progress', progress_router_1.default);
app.use('/api/admin', admin_router_1.default);
app.use('/api/notifications', notification_router_1.default);
app.use('/api/videos', video_router_1.default);
app.use('/api/notes', note_router_1.default);
app.use('/api/discussions', discussion_router_1.default);
app.use('/api/coupons', coupon_router_1.default);
app.use('/api/analytics', analytics_router_1.default);
app.use('/api/streak', streak_router_1.default);
app.use('/api/certificates', certificate_router_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
