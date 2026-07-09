"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcodeWorker = void 0;
const bullmq_1 = require("bullmq");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const redis_1 = require("../../../config/redis");
const env_1 = require("../../../config/env");
const lesson_model_1 = require("../../lesson/lesson.model");
const MetadataService_1 = require("../services/MetadataService");
const ThumbnailService_1 = require("../services/ThumbnailService");
const TranscodeService_1 = require("../services/TranscodeService");
const CleanupService_1 = require("../services/CleanupService");
const StorageService_1 = require("../../../storage/StorageService");
const videoSocket_1 = require("../../../utils/videoSocket");
/**
 * Converts an ffmpeg timemark string (HH:MM:SS.ms) into total seconds.
 * Returns 0 if the string cannot be parsed.
 */
function timemarkToSeconds(timemark) {
    try {
        const parts = timemark.replace(/,/g, '.').split(':');
        if (parts.length === 3) {
            return (parseFloat(parts[0]) * 3600 +
                parseFloat(parts[1]) * 60 +
                parseFloat(parts[2]));
        }
        return 0;
    }
    catch {
        return 0;
    }
}
exports.transcodeWorker = new bullmq_1.Worker('video-transcode', async (job) => {
    const { lessonId, videoPath } = job.data;
    const jobId = job.id;
    const startedAt = Date.now();
    // Load already-completed qualities from the DB so we can resume on retry
    const existingLesson = await lesson_model_1.Lesson.findById(lessonId).lean();
    // Guard: if lesson was deleted while job was queued/retrying, abort silently
    if (!existingLesson) {
        console.log(`[TranscodeWorker] Job ${jobId} aborted — lesson ${lessonId} no longer exists`);
        return;
    }
    // Guard: if source video file is gone (e.g., temp dir was cleaned), abort
    const sourceExists = await fs_1.default.promises.access(videoPath).then(() => true).catch(() => false);
    if (!sourceExists) {
        console.log(`[TranscodeWorker] Job ${jobId} aborted — source file missing: ${videoPath}`);
        await lesson_model_1.Lesson.findByIdAndUpdate(lessonId, { 'video.status': 'failed', 'video.progress': 0 });
        return;
    }
    const completedQualities = existingLesson?.video?.completedQualities ?? [];
    let lastDbSave = 0;
    /**
     * Sanitises percent to ensure it is always a valid finite number in [0, 100].
     * Guards against NaN / Infinity coming from ffmpeg or calculations.
     */
    const safePercent = (raw) => {
        if (!Number.isFinite(raw))
            return 0;
        return Math.min(100, Math.max(0, Math.round(raw)));
    };
    /**
     * Emits a WebSocket progress event on EVERY call (no I/O cost).
     * Throttles the DB write to at most once every 3 seconds, unless
     * a hard dbStatus is provided (e.g. 'ready' / 'failed').
     */
    const updateProgress = async (percent, stage, dbStatus) => {
        const pct = safePercent(percent);
        const elapsed = Date.now() - startedAt;
        // Always emit via WebSocket — in-memory, zero I/O cost
        (0, videoSocket_1.emitVideoProgress)({
            lessonId,
            jobId,
            percent: pct,
            stage,
            completedQualities: [...completedQualities],
            elapsedMs: elapsed,
        });
        await job.updateProgress(pct);
        // Throttle DB writes to once every 3 seconds
        const now = Date.now();
        if (dbStatus || now - lastDbSave >= 3000) {
            lastDbSave = now;
            await lesson_model_1.Lesson.findByIdAndUpdate(lessonId, {
                'video.progress': pct,
                'video.status': dbStatus || 'processing',
                'video.completedQualities': [...completedQualities],
            });
        }
    };
    try {
        await updateProgress(1, 'Starting…', 'processing');
        const tempOutputDir = path_1.default.join(env_1.env.VIDEO_TEMP_PATH, lessonId);
        const hlsDir = path_1.default.join(tempOutputDir, 'hls');
        // ── 2–5%: Extract metadata ──
        await updateProgress(2, 'Analysing video…');
        const metadata = await MetadataService_1.MetadataService.extractMetadata(videoPath);
        const totalDurationSec = metadata?.format?.duration ?? 0;
        await updateProgress(5, 'Video analysed');
        // ── 6–10%: Generate thumbnails ──
        await updateProgress(6, 'Generating thumbnails…');
        const thumbnailDir = path_1.default.join(tempOutputDir, 'thumbnails');
        const thumbnails = await ThumbnailService_1.ThumbnailService.generateThumbnails(videoPath, thumbnailDir);
        await updateProgress(10, 'Thumbnails ready');
        // ── 10–88%: PIPELINE — transcode each quality, then immediately start uploading it ──
        // While quality N is uploading to R2, quality N+1 is already being transcoded.
        // This halves total wall-clock time vs. transcode-all-then-upload-all.
        const qualities = Object.keys(TranscodeService_1.QUALITY_PRESETS);
        const transcodeShare = 70; // 10%→80% for transcoding
        const progressPerQuality = transcodeShare / qualities.length;
        const renditions = [];
        // Collects all background upload promises — we await them all after transcoding
        const uploadPromises = [];
        /**
         * Uploads a single quality's HLS directory to R2 in the background.
         * Errors are surfaced so the job can fail correctly.
         */
        const uploadQuality = async (quality) => {
            const qualityLocalDir = path_1.default.join(hlsDir, quality);
            const qualityDestPrefix = `videos/${lessonId}/hls/${quality}`;
            console.log(`[TranscodeWorker] Starting upload: ${quality} → ${qualityDestPrefix}`);
            await StorageService_1.storageService.uploadDirectory(qualityLocalDir, qualityDestPrefix);
            console.log(`[TranscodeWorker] Upload complete: ${quality}`);
        };
        for (let qi = 0; qi < qualities.length; qi++) {
            const quality = qualities[qi];
            const qStart = 10 + qi * progressPerQuality;
            const qEnd = qStart + progressPerQuality;
            // ── RESUME: skip transcoding for already-completed qualities ──
            if (completedQualities.includes(quality)) {
                console.log(`[TranscodeWorker] Skipping transcode (already done): ${quality}`);
                const preset = TranscodeService_1.QUALITY_PRESETS[quality];
                const [width, height] = preset.resolution.split('x').map(Number);
                renditions.push({
                    quality,
                    playlistKey: `videos/${lessonId}/hls/${quality}/index.m3u8`,
                    width, height,
                    bitrate: parseInt(preset.videoBitrate.replace('k', '000')),
                });
                // Re-kick the upload in case it never completed
                uploadPromises.push(uploadQuality(quality));
                continue;
            }
            // ── Transcode this quality ──
            let lastEmittedPercent = Math.floor(qStart);
            await updateProgress(lastEmittedPercent, `Transcoding ${quality}…`);
            await TranscodeService_1.TranscodeService.transcodeQuality(videoPath, hlsDir, quality, env_1.env.VIDEO_SEGMENT_DURATION, async (ffmpegInfo) => {
                let rawPercent;
                if (totalDurationSec > 0 && ffmpegInfo.timemark) {
                    const elapsed = timemarkToSeconds(ffmpegInfo.timemark);
                    rawPercent = Number.isFinite(elapsed) && elapsed > 0
                        ? Math.min(100, (elapsed / totalDurationSec) * 100)
                        : 0;
                }
                else {
                    rawPercent = Math.min(100, Math.max(0, ffmpegInfo.percent ?? 0));
                }
                if (!Number.isFinite(rawPercent))
                    rawPercent = 0;
                const overall = Math.floor(qStart + (rawPercent / 100) * (qEnd - qStart));
                if (overall <= lastEmittedPercent)
                    return;
                lastEmittedPercent = overall;
                await updateProgress(overall, `Transcoding ${quality}…`);
            });
            // ── Transcoding done — persist state and immediately kick off upload ──
            completedQualities.push(quality);
            await lesson_model_1.Lesson.findByIdAndUpdate(lessonId, { 'video.completedQualities': [...completedQualities] });
            await updateProgress(Math.floor(qEnd), `${quality} done — uploading…`, 'processing');
            const preset = TranscodeService_1.QUALITY_PRESETS[quality];
            const [width, height] = preset.resolution.split('x').map(Number);
            renditions.push({
                quality,
                playlistKey: `videos/${lessonId}/hls/${quality}/index.m3u8`,
                width, height,
                bitrate: parseInt(preset.videoBitrate.replace('k', '000')),
            });
            // 🚀 Start upload immediately — don't await, run in background
            uploadPromises.push(uploadQuality(quality));
        }
        // ── 80%: All transcoding done. Generate + upload master playlist ──
        await updateProgress(80, 'Generating master playlist…');
        await TranscodeService_1.TranscodeService.generateMasterPlaylist(hlsDir, qualities);
        const masterPlaylistKey = `videos/${lessonId}/hls/master.m3u8`;
        // Upload master playlist and thumbnails
        uploadPromises.push(StorageService_1.storageService.uploadFile(path_1.default.join(hlsDir, 'master.m3u8'), masterPlaylistKey), StorageService_1.storageService.uploadDirectory(thumbnailDir, `videos/${lessonId}/thumbnails`));
        // ── 80–98%: Wait for ALL uploads to finish ──
        await updateProgress(82, 'Waiting for uploads to finish…');
        await Promise.all(uploadPromises);
        // ── 99%: Save to DB ──
        await updateProgress(99, 'Saving to database…');
        await lesson_model_1.Lesson.findByIdAndUpdate(lessonId, {
            'video.status': 'ready',
            'video.progress': 100,
            'video.masterPlaylistKey': masterPlaylistKey,
            'video.completedQualities': [],
            'video.metadata': metadata,
            'video.thumbnail': {
                small: `videos/${lessonId}/thumbnails/${thumbnails.small}`,
                medium: `videos/${lessonId}/thumbnails/${thumbnails.medium}`,
                large: `videos/${lessonId}/thumbnails/${thumbnails.large}`,
            }
        });
        await updateProgress(100, 'Complete!', 'ready');
        (0, videoSocket_1.emitVideoComplete)(lessonId, jobId);
        // Cleanup temp files
        // Cleanup temp files (non-blocking errors are swallowed intentionally)
        await CleanupService_1.CleanupService.deletePath(videoPath);
        await CleanupService_1.CleanupService.deletePath(tempOutputDir);
    }
    catch (error) {
        console.error(`Transcode job ${jobId} failed:`, error);
        await lesson_model_1.Lesson.findByIdAndUpdate(lessonId, {
            'video.progress': 0,
            'video.status': 'failed',
        });
        (0, videoSocket_1.emitVideoFailed)(lessonId, jobId, error.message ?? 'Unknown error');
        throw error;
    }
}, {
    connection: redis_1.redis,
    // Keep the lock alive for up to 10 minutes per job.
    // Without this, BullMQ marks long transcode jobs as "stalled" after 30s.
    settings: {
        lockDuration: 600000, // 10 minutes
        lockRenewTime: 60000, // Renew every 60s (must be < lockDuration/2 recommended)
        stalledInterval: 30000, // Check for stalled jobs every 30s
        maxStalledCount: 1, // After 1 stall, mark as failed (not infinite loop)
    }
});
exports.transcodeWorker.on('failed', (job, err) => {
    console.error(`[TranscodeWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
});
