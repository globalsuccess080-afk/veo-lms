"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeCertificate = exports.getAdminCertificates = exports.getPublicCertificate = exports.requestPdfGeneration = exports.getCourseCertificate = exports.generateCertificate = void 0;
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const certificate_model_1 = require("./certificate.model");
const certificate_queue_1 = require("./certificate.queue");
const course_model_1 = require("../course/course.model");
const progress_model_1 = require("../progress/progress.model");
const lesson_model_1 = require("../lesson/lesson.model");
const apiError_1 = require("../../utils/apiError");
const env_1 = require("../../config/env");
const certificate_generator_1 = require("./certificate.generator");
exports.generateCertificate = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const courseId = req.params.courseId;
        const userId = req.user.id;
        const course = await course_model_1.Course.findById(courseId);
        if (!course)
            throw new apiError_1.ApiError(404, 'Course not found');
        const totalLessons = await lesson_model_1.Lesson.countDocuments({ courseId });
        const completedLessons = await progress_model_1.Progress.countDocuments({ userId, courseId, isCompleted: true });
        const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        if (progressPct < 85) {
            throw new apiError_1.ApiError(400, `Insufficient progress (${progressPct}%). Must be at least 85%.`);
        }
        const existing = await certificate_model_1.Certificate.findOne({ userId, courseId });
        if (existing) {
            return (0, apiResponse_1.sendSuccess)(res, existing, 'Certificate already exists');
        }
        await certificate_queue_1.certificateQueue.add('generate', { userId, courseId });
        res.status(202).json({
            success: true,
            message: 'Certificate generation started. Please check back shortly.',
            data: null,
        });
    }),
];
exports.getCourseCertificate = [
    auth_middleware_1.authenticate,
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const cert = await certificate_model_1.Certificate.findOne({
            userId: req.user.id,
            courseId: req.params.courseId,
        });
        if (!cert) {
            return res.status(202).json({
                success: false,
                message: 'Certificate is not ready yet. Please try again in a moment.',
                data: null,
            });
        }
        (0, apiResponse_1.sendSuccess)(res, cert);
    }),
];
exports.requestPdfGeneration = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const cert = await certificate_model_1.Certificate.findOne({ certificateId: req.params.certificateId }).populate('userId courseId');
    if (!cert)
        throw new apiError_1.ApiError(404, 'Certificate not found');
    const user = cert.userId;
    const course = cert.courseId;
    const publicUrl = `${env_1.env.FRONTEND_URL}/certificate/${cert.certificateId}`;
    const dateStr = new Date(cert.issuedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const pdfBytes = await (0, certificate_generator_1.generatePDF)({
        studentName: user.name,
        courseName: course.title,
        date: dateStr,
        certId: cert.certificateId,
        publicUrl
    });
    const base64Data = Buffer.from(pdfBytes).toString('base64');
    (0, apiResponse_1.sendSuccess)(res, { data: base64Data });
});
exports.getPublicCertificate = [
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const cert = await certificate_model_1.Certificate.findOne({ certificateId: req.params.certificateId })
            .populate('userId', 'name')
            .populate('courseId', 'title')
            .lean();
        if (!cert)
            throw new apiError_1.ApiError(404, 'Certificate not found');
        (0, apiResponse_1.sendSuccess)(res, {
            certificateId: cert.certificateId,
            studentName: cert.userId.name,
            courseName: cert.courseId.title,
            issuedAt: cert.issuedAt,
        });
    }),
];
exports.getAdminCertificates = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const certs = await certificate_model_1.Certificate.find()
            .populate('userId', 'name email')
            .populate('courseId', 'title')
            .sort({ createdAt: -1 })
            .lean();
        (0, apiResponse_1.sendSuccess)(res, certs);
    }),
];
exports.revokeCertificate = [
    auth_middleware_1.authenticate,
    (0, role_middleware_1.requireRole)('admin'),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const cert = await certificate_model_1.Certificate.findOneAndUpdate({ certificateId: req.params.certificateId }, { status: 'revoked' }, { new: true });
        if (!cert)
            throw new apiError_1.ApiError(404, 'Certificate not found');
        (0, apiResponse_1.sendSuccess)(res, cert, 'Certificate revoked successfully');
    }),
];
