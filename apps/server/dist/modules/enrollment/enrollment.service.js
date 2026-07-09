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
exports.getMyEnrollments = getMyEnrollments;
exports.checkEnrollment = checkEnrollment;
exports.createEnrollment = createEnrollment;
const enrollment_model_1 = require("./enrollment.model");
const course_model_1 = require("../course/course.model");
const apiError_1 = require("../../utils/apiError");
const assetPath_1 = require("../../utils/assetPath");
async function getMyEnrollments(userId) {
    const enrollments = await enrollment_model_1.Enrollment.find({ userId, isActive: true })
        .populate('courseId')
        .sort({ enrolledAt: -1 })
        .lean();
    return enrollments.map((e) => {
        const course = e.courseId;
        const formattedCourse = course && typeof course === 'object'
            ? { ...course, thumbnail: course.thumbnail ? (0, assetPath_1.formatAssetPath)(course.thumbnail) : course.thumbnail }
            : course;
        return {
            id: e._id.toString(),
            userId: e.userId.toString(),
            courseId: course?._id?.toString() || String(e.courseId),
            enrolledAt: e.enrolledAt.toISOString(),
            completedAt: e.completedAt?.toISOString() || null,
            isActive: e.isActive,
            progress: e.progress,
            course: formattedCourse
        };
    });
}
async function checkEnrollment(userId, courseId) {
    const enrollment = await enrollment_model_1.Enrollment.findOne({ userId, courseId, isActive: true });
    return { enrolled: !!enrollment, enrollment };
}
async function createEnrollment(userId, courseId, paymentId) {
    const existing = await enrollment_model_1.Enrollment.findOne({ userId, courseId });
    if (existing)
        throw new apiError_1.ApiError(409, 'Already enrolled');
    const enrollment = await enrollment_model_1.Enrollment.create({ userId, courseId, paymentId });
    const course = await course_model_1.Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });
    const { User } = await Promise.resolve().then(() => __importStar(require('../user/user.model')));
    const user = await User.findById(userId);
    if (user && course) {
        const { emailQueue } = await Promise.resolve().then(() => __importStar(require('../email/email.queue')));
        const { generateEnrollmentEmail } = await Promise.resolve().then(() => __importStar(require('../email/templates')));
        await emailQueue.add('sendEmail', {
            to: user.getDecryptedEmail(),
            subject: `Welcome to ${course.title}`,
            html: generateEnrollmentEmail(course.title)
        });
    }
    return enrollment;
}
