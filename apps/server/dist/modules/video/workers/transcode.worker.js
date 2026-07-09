"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcodeWorker = void 0;
const path_1 = __importDefault(require("path"));
const bullmq_1 = require("bullmq");
const redis_1 = require("../../../config/redis");
const env_1 = require("../../../config/env");
const upload_1 = require("../../../config/upload");
const bullmq_2 = require("../../../config/bullmq");
const lesson_model_1 = require("../../lesson/lesson.model");
const StorageService_1 = require("../../../storage/StorageService");
const CleanupService_1 = require("../services/CleanupService");
const MetadataService_1 = require("../services/MetadataService");
const ProgressService_1 = require("../services/ProgressService");
const ThumbnailService_1 = require("../services/ThumbnailService");
const TranscodeService_1 = require("../services/TranscodeService");
function timemarkToSeconds(value) {
    if (!value)
        return 0;
    const parts = value.replace(',', '.').split(':').map(Number);
    return parts.length === 3 && parts.every(Number.isFinite)
        ? parts[0] * 3600 + parts[1] * 60 + parts[2]
        : 0;
}
async function processTranscode(job) {
    const { lessonId, videoR2Key } = job.data;
    if (!videoR2Key) {
        throw new Error('Missing source video in storage. Please re-upload the video.');
    }
    const startedAt = Date.now();
    const progress = new ProgressService_1.ProgressService(job, lessonId, startedAt);
    const ext = path_1.default.extname(videoR2Key) || '.mp4';
    const videoPath = path_1.default.join(upload_1.UPLOAD_ROOT, 'videos', `${job.id}${ext}`);
    const outputDir = path_1.default.join(upload_1.UPLOAD_ROOT, lessonId);
    const hlsDir = path_1.default.join(outputDir, 'hls');
    const thumbnailDir = path_1.default.join(outputDir, 'thumbnails');
    let handedOff = false;
    try {
        if (!await lesson_model_1.Lesson.exists({ _id: lessonId, 'video.jobId': String(job.id) }))
            return { skipped: 'stale-job' };
        await progress.transition('ANALYZING', 1, 'Downloading source video');
        await StorageService_1.storageService.downloadFile(videoR2Key, videoPath);
        await progress.report('ANALYZING', 2, 'Analyzing video');
        const metadata = await MetadataService_1.MetadataService.extractMetadata(videoPath);
        await progress.report('ANALYZING', 5, 'Video analyzed');
        await progress.transition('GENERATING_THUMBNAILS', 5, 'Generating thumbnails');
        const thumbnails = await ThumbnailService_1.ThumbnailService.generateThumbnails(videoPath, thumbnailDir);
        await progress.report('GENERATING_THUMBNAILS', 10, 'Thumbnails ready');
        await progress.transition('TRANSCODING', 10, 'Generating adaptive HLS renditions');
        const expectedQualities = (0, TranscodeService_1.resolveQualities)(metadata.height);
        const qualities = await TranscodeService_1.TranscodeService.transcodeAllQualities(videoPath, hlsDir, metadata.height, env_1.env.VIDEO_SEGMENT_DURATION, info => {
            const encodedSeconds = timemarkToSeconds(info.timemark);
            const raw = metadata.duration > 0 ? encodedSeconds / metadata.duration * 100 : info.percent ?? 0;
            const overall = 10 + Math.min(100, Math.max(0, raw)) * 0.6;
            const elapsedSeconds = (Date.now() - startedAt) / 1000;
            const etaSeconds = raw > 1 ? Math.max(0, Math.round(elapsedSeconds / raw * (100 - raw))) : null;
            void progress.report('TRANSCODING', overall, info.quality ? `Transcoding ${info.quality}` : 'Generating adaptive HLS renditions', {
                etaSeconds,
                currentQuality: info.quality,
                completedQualities: raw >= 100 ? expectedQualities : [],
            });
        });
        if (!await lesson_model_1.Lesson.exists({ _id: lessonId, 'video.jobId': String(job.id) }))
            return { skipped: 'stale-job' };
        await progress.transition('UPLOADING_STORAGE', 70, 'Queued for storage upload', { completedQualities: qualities });
        const uploadData = {
            lessonId, transcodeJobId: String(job.id), startedAt, videoPath, outputDir,
            metadata, thumbnails, qualities,
        };
        await bullmq_2.videoUploadQueue.add('upload', uploadData, { jobId: `video-${lessonId}-${job.id}` });
        handedOff = true;
        await StorageService_1.storageService.deleteFile(videoR2Key).catch(() => undefined);
        return { lessonId, uploadQueued: true };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Video processing failed';
        await progress.transition('FAILED', 0, message).catch(() => undefined);
        await StorageService_1.storageService.deleteFile(videoR2Key).catch(() => undefined);
        throw error;
    }
    finally {
        if (!handedOff) {
            await Promise.allSettled([CleanupService_1.CleanupService.deletePath(videoPath), CleanupService_1.CleanupService.deletePath(outputDir)]);
        }
    }
}
exports.transcodeWorker = new bullmq_1.Worker('video-transcode', processTranscode, {
    connection: redis_1.redis,
    concurrency: 1,
    lockDuration: 10 * 60 * 1000,
    stalledInterval: 30 * 1000,
    maxStalledCount: 1,
});
exports.transcodeWorker.on('failed', (job, error) => {
    console.error(`[video-transcode] job ${job?.id} failed:`, error.message);
});
