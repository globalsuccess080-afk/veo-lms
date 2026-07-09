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
exports.uploadWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../../../config/redis");
const lesson_model_1 = require("../../lesson/lesson.model");
const StorageService_1 = require("../../../storage/StorageService");
const CleanupService_1 = require("../services/CleanupService");
const ProgressService_1 = require("../services/ProgressService");
const videoSocket_1 = require("../../../utils/videoSocket");
async function processUpload(job) {
    const data = job.data;
    const startedAt = data.startedAt;
    const progress = new ProgressService_1.ProgressService(job, data.lessonId, startedAt);
    const destination = `videos/${data.lessonId}/versions/${data.transcodeJobId}`;
    const ownsLesson = () => lesson_model_1.Lesson.exists({ _id: data.lessonId, 'video.jobId': data.transcodeJobId });
    if (!await ownsLesson()) {
        await Promise.allSettled([CleanupService_1.CleanupService.deletePath(data.videoPath), CleanupService_1.CleanupService.deletePath(data.outputDir)]);
        return { skipped: 'lesson-deleted', lessonId: data.lessonId, transcodeJobId: data.transcodeJobId };
    }
    await progress.transition('UPLOADING_STORAGE', 70, 'Uploading video files', {
        completedQualities: data.qualities,
    });
    await StorageService_1.storageService.uploadDirectory(data.outputDir, destination, (uploaded, total) => {
        const percent = 70 + uploaded / Math.max(total, 1) * 25;
        void progress.report('UPLOADING_STORAGE', percent, `Uploading ${uploaded} of ${total} files`, {
            completedQualities: data.qualities,
        });
    }, 8);
    if (!await ownsLesson()) {
        await StorageService_1.storageService.deleteDirectory(destination).catch(() => undefined);
        await Promise.allSettled([CleanupService_1.CleanupService.deletePath(data.videoPath), CleanupService_1.CleanupService.deletePath(data.outputDir)]);
        return { skipped: 'lesson-deleted', lessonId: data.lessonId, transcodeJobId: data.transcodeJobId };
    }
    await progress.transition('FINALIZING', 95, 'Finalizing video', { completedQualities: data.qualities });
    const thumbnailPrefix = `${destination}/thumbnails`;
    const storagePath = `${destination}/hls`;
    const duration = Number.isFinite(data.metadata.duration) && data.metadata.duration > 0
        ? Math.round(data.metadata.duration)
        : 0;
    const finalized = await lesson_model_1.Lesson.findOneAndUpdate({ _id: data.lessonId, 'video.jobId': data.transcodeJobId }, {
        duration,
        'video.masterPlaylistKey': `${destination}/hls/master.m3u8`,
        'video.storagePath': storagePath,
        'video.version': data.transcodeJobId,
        'video.availableQualities': data.qualities,
        'video.transcodedAt': new Date(),
        'video.metadata': data.metadata,
        'video.thumbnail': {
            small: `${thumbnailPrefix}/${data.thumbnails.small}`,
            medium: `${thumbnailPrefix}/${data.thumbnails.medium}`,
            large: `${thumbnailPrefix}/${data.thumbnails.large}`,
        },
        'video.completedQualities': data.qualities,
        'video.failedReason': '',
    }, { new: true });
    if (!finalized) {
        await StorageService_1.storageService.deleteDirectory(destination).catch(() => undefined);
        await Promise.allSettled([CleanupService_1.CleanupService.deletePath(data.videoPath), CleanupService_1.CleanupService.deletePath(data.outputDir)]);
        return { skipped: 'stale-job', lessonId: data.lessonId, transcodeJobId: data.transcodeJobId };
    }
    try {
        const { recalcStats } = await Promise.resolve().then(() => __importStar(require('../../course/course.service')));
        await recalcStats(finalized.courseId.toString());
    }
    catch (e) {
        console.error('Failed to recalcStats after video upload', e);
    }
    await progress.transition('READY', 100, 'Video is ready', { completedQualities: data.qualities });
    await Promise.allSettled([CleanupService_1.CleanupService.deletePath(data.videoPath), CleanupService_1.CleanupService.deletePath(data.outputDir)]);
    return { lessonId: data.lessonId, transcodeJobId: data.transcodeJobId };
}
exports.uploadWorker = new bullmq_1.Worker('video-upload', processUpload, {
    connection: redis_1.redis,
    concurrency: 4,
    lockDuration: 10 * 60 * 1000,
    stalledInterval: 30 * 1000,
    maxStalledCount: 2,
});
exports.uploadWorker.on('completed', async (job) => {
    if (await lesson_model_1.Lesson.exists({ _id: job.data.lessonId, 'video.jobId': job.data.transcodeJobId })) {
        (0, videoSocket_1.emitVideoComplete)(job.data.lessonId, job.data.transcodeJobId);
    }
});
exports.uploadWorker.on('failed', async (job, error) => {
    if (!job)
        return;
    const attempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < attempts)
        return;
    const ownsLesson = await lesson_model_1.Lesson.exists({ _id: job.data.lessonId, 'video.jobId': job.data.transcodeJobId });
    if (ownsLesson) {
        const progress = new ProgressService_1.ProgressService(job, job.data.lessonId, job.data.startedAt);
        await progress.transition('FAILED', 0, error.message).catch(() => undefined);
        (0, videoSocket_1.emitVideoFailed)(job.data.lessonId, job.data.transcodeJobId, error.message);
    }
    await Promise.allSettled([
        CleanupService_1.CleanupService.deletePath(job.data.videoPath),
        CleanupService_1.CleanupService.deletePath(job.data.outputDir),
    ]);
});
