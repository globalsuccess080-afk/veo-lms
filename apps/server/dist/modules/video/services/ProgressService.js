"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const lesson_model_1 = require("../../lesson/lesson.model");
const videoSocket_1 = require("../../../utils/videoSocket");
const STATUS_BY_STAGE = {
    UPLOADING: 'uploading', QUEUED: 'queued', ANALYZING: 'processing',
    GENERATING_THUMBNAILS: 'processing', TRANSCODING: 'processing',
    UPLOADING_STORAGE: 'uploading-storage', FINALIZING: 'processing',
    READY: 'ready', FAILED: 'failed',
};
function clamp(value) {
    return Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
}
class ProgressService {
    job;
    lessonId;
    startedAt;
    lastPercent = -1;
    lastEmitAt = 0;
    constructor(job, lessonId, startedAt) {
        this.job = job;
        this.lessonId = lessonId;
        this.startedAt = startedAt;
    }
    async transition(stage, progress, message, extra = {}) {
        const percent = clamp(progress);
        const update = {
            'video.status': STATUS_BY_STAGE[stage], 'video.stage': stage,
            'video.progress': percent, 'video.message': message,
            'video.etaSeconds': extra.etaSeconds ?? null,
            'video.currentQuality': extra.currentQuality ?? '',
        };
        if (stage === 'ANALYZING')
            update['video.startedAt'] = new Date(this.startedAt);
        if (stage === 'READY')
            update['video.completedAt'] = new Date();
        if (stage === 'FAILED')
            update['video.failedReason'] = message;
        await lesson_model_1.Lesson.findByIdAndUpdate(this.lessonId, update);
        await this.publish(stage, percent, message, extra, true);
    }
    async report(stage, progress, message, extra = {}) {
        await this.publish(stage, clamp(progress), message, extra, false);
    }
    async publish(stage, percent, message, extra, force) {
        const now = Date.now();
        if (!force && percent < this.lastPercent + 2 && now - this.lastEmitAt < 1000)
            return;
        this.lastPercent = percent;
        this.lastEmitAt = now;
        const value = {
            stage, progress: percent, message, etaSeconds: extra.etaSeconds ?? null,
            currentQuality: extra.currentQuality, completedQualities: extra.completedQualities ?? [],
        };
        await this.job.updateProgress(value);
        (0, videoSocket_1.emitVideoProgress)({
            lessonId: this.lessonId, jobId: String(this.job.id), percent, stage, message,
            etaSeconds: value.etaSeconds, currentQuality: value.currentQuality,
            completedQualities: value.completedQualities, elapsedMs: now - this.startedAt,
        });
    }
}
exports.ProgressService = ProgressService;
