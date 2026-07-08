import { Worker, Job } from 'bullmq';
import path from 'path';
import fs from 'fs';
import { redis } from '../../../config/redis';
import { env } from '../../../config/env';
import { Lesson } from '../../lesson/lesson.model';
import { MetadataService } from '../services/MetadataService';
import { ThumbnailService } from '../services/ThumbnailService';
import { TranscodeService, QUALITY_PRESETS } from '../services/TranscodeService';
import { CleanupService } from '../services/CleanupService';
import { storageService } from '../../../storage/storageService';
import { emitVideoProgress, emitVideoComplete, emitVideoFailed } from '../../../utils/videoSocket';

/**
 * Converts an ffmpeg timemark string (HH:MM:SS.ms) into total seconds.
 * Returns 0 if the string cannot be parsed.
 */
function timemarkToSeconds(timemark: string): number {
  try {
    const parts = timemark.replace(/,/g, '.').split(':');
    if (parts.length === 3) {
      return (
        parseFloat(parts[0]) * 3600 +
        parseFloat(parts[1]) * 60 +
        parseFloat(parts[2])
      );
    }
    return 0;
  } catch {
    return 0;
  }
}

export const transcodeWorker = new Worker('video-transcode', async (job: Job) => {
  const { lessonId, videoPath } = job.data;
  const jobId = job.id!;
  const startedAt = Date.now();

  // Load already-completed qualities from the DB so we can resume on retry
  const existingLesson = await Lesson.findById(lessonId).lean();
  
  // Guard: if lesson was deleted while job was queued/retrying, abort silently
  if (!existingLesson) {
    console.log(`[TranscodeWorker] Job ${jobId} aborted — lesson ${lessonId} no longer exists`);
    return;
  }

  // Guard: if source video file is gone (e.g., temp dir was cleaned), abort
  const sourceExists = await fs.promises.access(videoPath).then(() => true).catch(() => false);
  if (!sourceExists) {
    console.log(`[TranscodeWorker] Job ${jobId} aborted — source file missing: ${videoPath}`);
    await Lesson.findByIdAndUpdate(lessonId, { 'video.status': 'failed', 'video.progress': 0 });
    return;
  }

  const completedQualities: string[] = (existingLesson as any)?.video?.completedQualities ?? [];

  let lastDbSave = 0;

  /**
   * Sanitises percent to ensure it is always a valid finite number in [0, 100].
   * Guards against NaN / Infinity coming from ffmpeg or calculations.
   */
  const safePercent = (raw: number): number => {
    if (!Number.isFinite(raw)) return 0;
    return Math.min(100, Math.max(0, Math.round(raw)));
  };

  /**
   * Emits a WebSocket progress event on EVERY call (no I/O cost).
   * Throttles the DB write to at most once every 3 seconds, unless
   * a hard dbStatus is provided (e.g. 'ready' / 'failed').
   */
  const updateProgress = async (
    percent: number,
    stage: string,
    dbStatus?: string
  ): Promise<void> => {
    const pct = safePercent(percent);
    const elapsed = Date.now() - startedAt;

    // Always emit via WebSocket — in-memory, zero I/O cost
    emitVideoProgress({
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
      await Lesson.findByIdAndUpdate(lessonId, {
        'video.progress': pct,
        'video.status': dbStatus || 'processing',
        'video.completedQualities': [...completedQualities],
      });
    }
  };

  try {
    await updateProgress(1, 'Starting…', 'processing');

    const tempOutputDir = path.join(env.VIDEO_TEMP_PATH, lessonId);
    const hlsDir = path.join(tempOutputDir, 'hls');

    // ── 2–5%: Extract metadata ──
    await updateProgress(2, 'Analysing video…');
    const metadata = await MetadataService.extractMetadata(videoPath);
    const totalDurationSec: number = (metadata as any)?.format?.duration ?? 0;
    await updateProgress(5, 'Video analysed');

    // ── 6–10%: Generate thumbnails ──
    await updateProgress(6, 'Generating thumbnails…');
    const thumbnailDir = path.join(tempOutputDir, 'thumbnails');
    const thumbnails = await ThumbnailService.generateThumbnails(videoPath, thumbnailDir);
    await updateProgress(10, 'Thumbnails ready');

    // ── 10–88%: PIPELINE — transcode each quality, then immediately start uploading it ──
    // While quality N is uploading to R2, quality N+1 is already being transcoded.
    // This halves total wall-clock time vs. transcode-all-then-upload-all.
    const qualities = Object.keys(QUALITY_PRESETS);
    const transcodeShare = 70;                          // 10%→80% for transcoding
    const progressPerQuality = transcodeShare / qualities.length;
    const renditions: { quality: string; playlistKey: string; width: number; height: number; bitrate: number }[] = [];

    // Collects all background upload promises — we await them all after transcoding
    const uploadPromises: Promise<void>[] = [];

    /**
     * Uploads a single quality's HLS directory to R2 in the background.
     * Errors are surfaced so the job can fail correctly.
     */
    const uploadQuality = async (quality: string): Promise<void> => {
      const qualityLocalDir = path.join(hlsDir, quality);
      const qualityDestPrefix = `videos/${lessonId}/hls/${quality}`;
      console.log(`[TranscodeWorker] Starting upload: ${quality} → ${qualityDestPrefix}`);
      await storageService.uploadDirectory(qualityLocalDir, qualityDestPrefix);
      console.log(`[TranscodeWorker] Upload complete: ${quality}`);
    };

    for (let qi = 0; qi < qualities.length; qi++) {
      const quality = qualities[qi];
      const qStart = 10 + qi * progressPerQuality;
      const qEnd = qStart + progressPerQuality;

      // ── RESUME: skip transcoding for already-completed qualities ──
      if (completedQualities.includes(quality)) {
        console.log(`[TranscodeWorker] Skipping transcode (already done): ${quality}`);
        const preset = QUALITY_PRESETS[quality];
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

      await TranscodeService.transcodeQuality(
        videoPath,
        hlsDir,
        quality,
        env.VIDEO_SEGMENT_DURATION,
        async (ffmpegInfo) => {
          let rawPercent: number;
          if (totalDurationSec > 0 && ffmpegInfo.timemark) {
            const elapsed = timemarkToSeconds(ffmpegInfo.timemark);
            rawPercent = Number.isFinite(elapsed) && elapsed > 0
              ? Math.min(100, (elapsed / totalDurationSec) * 100)
              : 0;
          } else {
            rawPercent = Math.min(100, Math.max(0, ffmpegInfo.percent ?? 0));
          }
          if (!Number.isFinite(rawPercent)) rawPercent = 0;

          const overall = Math.floor(qStart + (rawPercent / 100) * (qEnd - qStart));
          if (overall <= lastEmittedPercent) return;
          lastEmittedPercent = overall;
          await updateProgress(overall, `Transcoding ${quality}…`);
        }
      );

      // ── Transcoding done — persist state and immediately kick off upload ──
      completedQualities.push(quality);
      await Lesson.findByIdAndUpdate(lessonId, { 'video.completedQualities': [...completedQualities] });
      await updateProgress(Math.floor(qEnd), `${quality} done — uploading…`, 'processing');

      const preset = QUALITY_PRESETS[quality];
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
    await TranscodeService.generateMasterPlaylist(hlsDir, qualities);
    const masterPlaylistKey = `videos/${lessonId}/hls/master.m3u8`;

    // Upload master playlist and thumbnails
    uploadPromises.push(
      storageService.uploadFile(path.join(hlsDir, 'master.m3u8'), masterPlaylistKey),
      storageService.uploadDirectory(thumbnailDir, `videos/${lessonId}/thumbnails`),
    );

    // ── 80–98%: Wait for ALL uploads to finish ──
    await updateProgress(82, 'Waiting for uploads to finish…');
    await Promise.all(uploadPromises);

    // ── 99%: Save to DB ──
    await updateProgress(99, 'Saving to database…');
    await Lesson.findByIdAndUpdate(lessonId, {
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
    emitVideoComplete(lessonId, jobId);

    // Cleanup temp files
    // Cleanup temp files (non-blocking errors are swallowed intentionally)
    await CleanupService.deletePath(videoPath);
    await CleanupService.deletePath(tempOutputDir);
  } catch (error: any) {
    console.error(`Transcode job ${jobId} failed:`, error);
    await Lesson.findByIdAndUpdate(lessonId, {
      'video.progress': 0,
      'video.status': 'failed',
    });
    emitVideoFailed(lessonId, jobId, error.message ?? 'Unknown error');
    throw error;
  }
}, {
  connection: redis,
  // Keep the lock alive for up to 10 minutes per job.
  // Without this, BullMQ marks long transcode jobs as "stalled" after 30s.
  settings: {
    lockDuration: 600000,       // 10 minutes
    lockRenewTime: 60000,       // Renew every 60s (must be < lockDuration/2 recommended)
    stalledInterval: 30000,     // Check for stalled jobs every 30s
    maxStalledCount: 1,          // After 1 stall, mark as failed (not infinite loop)
  }
});

transcodeWorker.on('failed', (job, err) => {
  console.error(`[TranscodeWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
});

