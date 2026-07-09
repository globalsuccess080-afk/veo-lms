"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonProgress = exports.playlist = exports.playVideo = exports.jobStatus = exports.uploadResource = exports.uploadImage = exports.upload = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../utils/apiError");
const lesson_model_1 = require("../lesson/lesson.model");
const bullmq_1 = require("../../config/bullmq");
const StorageService_1 = require("../../storage/StorageService");
const assetPath_1 = require("../../utils/assetPath");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const crypto_1 = require("crypto");
const params_1 = require("../../utils/params");
const lesson_service_1 = require("../lesson/lesson.service");
const video_delivery_1 = require("./video.delivery");
exports.upload = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file)
        throw new apiError_1.ApiError(400, 'No video file provided');
    const lessonId = String(req.body.lessonId || '');
    if (!lessonId) {
        await promises_1.default.unlink(req.file.path).catch(() => undefined);
        throw new apiError_1.ApiError(400, 'lessonId is required');
    }
    const lesson = await lesson_model_1.Lesson.findById(lessonId);
    if (!lesson) {
        await promises_1.default.unlink(req.file.path).catch(() => undefined);
        throw new apiError_1.ApiError(404, 'Lesson not found');
    }
    const previousJobId = lesson.video.jobId;
    if (previousJobId) {
        const previousJob = await bullmq_1.videoQueue.getJob(previousJobId).catch(() => null);
        const previousState = await previousJob?.getState().catch(() => null);
        if (previousJob && previousState && ['waiting', 'delayed', 'prioritized'].includes(previousState)) {
            await previousJob.remove().catch(() => undefined);
        }
    }
    const jobId = (0, crypto_1.randomUUID)();
    lesson.video.status = 'queued';
    lesson.video.stage = 'QUEUED';
    lesson.video.message = 'Uploading video to storage';
    lesson.video.progress = 0;
    lesson.video.storageProvider = 'r2';
    lesson.video.jobId = jobId;
    lesson.video.failedReason = '';
    await lesson.save();
    const ext = req.file.originalname
        ? path_1.default.extname(req.file.originalname).toLowerCase() || '.mp4'
        : '.mp4';
    const videoR2Key = `source-videos/${lessonId}/${jobId}${ext}`;
    try {
        await StorageService_1.storageService.uploadFile(req.file.path, videoR2Key);
    }
    catch (uploadError) {
        await promises_1.default.unlink(req.file.path).catch(() => undefined);
        lesson.video.status = 'failed';
        lesson.video.stage = 'FAILED';
        lesson.video.message = 'Failed to upload video to storage';
        await lesson.save();
        throw uploadError;
    }
    await promises_1.default.unlink(req.file.path).catch(() => undefined);
    lesson.video.message = 'Waiting for an available transcoder';
    await lesson.save();
    try {
        await bullmq_1.videoQueue.add('transcode', {
            lessonId, videoR2Key, userId: req.user?.id,
        }, {
            jobId, priority: 1, attempts: 1, removeOnComplete: false, removeOnFail: false,
        });
    }
    catch (error) {
        await StorageService_1.storageService.deleteFile(videoR2Key).catch(() => undefined);
        lesson.video.status = 'failed';
        lesson.video.stage = 'FAILED';
        lesson.video.message = 'Could not queue video processing';
        await lesson.save();
        throw error;
    }
    (0, apiResponse_1.sendSuccess)(res, { jobId, status: 'queued', lessonId }, 'Video uploaded and queued for processing successfully', 201);
});
exports.uploadImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file)
        throw new apiError_1.ApiError(400, 'No image file provided');
    const key = `images/${req.file.filename}`;
    const result = await StorageService_1.storageService.uploadFile(req.file.path, key);
    await promises_1.default.unlink(req.file.path).catch(() => { });
    (0, apiResponse_1.sendSuccess)(res, { path: (0, assetPath_1.formatAssetPath)(result.key), key: result.key, fileName: req.file.filename, size: req.file.size }, 'Image uploaded successfully', 201);
});
exports.uploadResource = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file)
        throw new apiError_1.ApiError(400, 'No file provided');
    const key = `resources/${req.file.filename}`;
    await StorageService_1.storageService.uploadFile(req.file.path, key);
    await promises_1.default.unlink(req.file.path).catch(() => { });
    (0, apiResponse_1.sendSuccess)(res, { path: (0, assetPath_1.formatAssetPath)(key), key, fileName: req.file.originalname, size: req.file.size, type: req.file.mimetype }, 'Resource uploaded successfully', 201);
});
exports.jobStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    const id = Array.isArray(jobId) ? jobId[0] : jobId;
    const job = await bullmq_1.videoQueue.getJob(id) ?? await bullmq_1.videoUploadQueue.getJob(id);
    if (!job) {
        throw new apiError_1.ApiError(404, 'Job not found');
    }
    const state = await job.getState();
    const progress = job.progress;
    (0, apiResponse_1.sendSuccess)(res, { status: state, progress });
});
exports.playVideo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const lessonId = (0, params_1.param)(req.params.lessonId);
    const video = await (0, lesson_service_1.getVideoUrl)(lessonId, req.user.id, req.user.role);
    if (video.status !== 'ready' || !video.playlistPath) {
        throw new apiError_1.ApiError(400, 'Video is not ready yet');
    }
    (0, apiResponse_1.sendSuccess)(res, video);
});
exports.playlist = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const wildcard = req.params.path;
    const requestedPath = Array.isArray(wildcard) ? wildcard.join('/') : String(wildcard || '');
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token)
        throw new apiError_1.ApiError(401, 'Video access token is required');
    const content = await (0, video_delivery_1.buildAuthorizedPlaylist)(requestedPath, token);
    res.set({
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'private, no-store, max-age=0',
        Pragma: 'no-cache',
    });
    res.status(200).send(content);
});
exports.lessonProgress = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const lessonId = (0, params_1.param)(req.params.lessonId);
    const lesson = await lesson_model_1.Lesson.findById(lessonId).lean();
    if (!lesson)
        throw new apiError_1.ApiError(404, 'Lesson not found');
    (0, apiResponse_1.sendSuccess)(res, {
        lessonId,
        status: lesson.video.status,
        progress: lesson.video.progress ?? 0,
        stage: lesson.video.stage,
        message: lesson.video.message,
        etaSeconds: lesson.video.etaSeconds,
        currentQuality: lesson.video.currentQuality,
        completedQualities: lesson.video.completedQualities,
        failedReason: lesson.video.failedReason,
        jobId: lesson.video.jobId,
    });
});
