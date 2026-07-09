"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscodeService = exports.QUALITY_PRESETS = void 0;
exports.resolveQualities = resolveQualities;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../../../config/env");
exports.QUALITY_PRESETS = {
    '360p': { resolution: '640x360', videoBitrate: '600k', audioBitrate: '96k' },
    '480p': { resolution: '854x480', videoBitrate: '1200k', audioBitrate: '128k' },
    '720p': { resolution: '1280x720', videoBitrate: '2000k', audioBitrate: '128k' },
    '1080p': { resolution: '1920x1080', videoBitrate: '4500k', audioBitrate: '192k' },
};
const QUALITY_ORDER = ['360p', '480p', '720p', '1080p'];
function presetHeight(quality) {
    const resolution = exports.QUALITY_PRESETS[quality]?.resolution;
    if (!resolution)
        return 0;
    return Number(resolution.split('x')[1]) || 0;
}
function resolveQualities(sourceHeight) {
    const maxHeight = env_1.env.NODE_ENV === 'production'
        ? Math.min(sourceHeight || 720, 720)
        : sourceHeight || 1080;
    const selected = QUALITY_ORDER.filter(quality => presetHeight(quality) <= maxHeight);
    return selected.length > 0 ? [...selected] : ['360p'];
}
class TranscodeService {
    static async transcodeAllQualities(videoPath, outputDir, sourceHeight, segmentDuration = 4, onProgress) {
        const qualities = resolveQualities(sourceHeight);
        await promises_1.default.mkdir(outputDir, { recursive: true });
        for (let index = 0; index < qualities.length; index++) {
            const quality = qualities[index];
            const qualityDir = path_1.default.join(outputDir, quality);
            await promises_1.default.mkdir(qualityDir, { recursive: true });
            await this.transcodeQuality(videoPath, qualityDir, quality, segmentDuration, info => {
                const slice = 100 / qualities.length;
                const base = index * slice;
                const percent = base + Math.min(slice, Math.max(0, (info.percent ?? 0) / 100 * slice));
                onProgress?.({ percent, timemark: info.timemark, quality });
            });
        }
        await this.generateMasterPlaylist(outputDir, qualities);
        return qualities;
    }
    static transcodeQuality(videoPath, qualityDir, quality, segmentDuration, onProgress) {
        const options = exports.QUALITY_PRESETS[quality];
        const [width, height] = options.resolution.split('x');
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(videoPath)
                .output(path_1.default.join(qualityDir, 'index.m3u8'))
                .outputOptions([
                '-c:v libx264',
                '-preset ultrafast',
                '-threads 2',
                `-b:v ${options.videoBitrate}`,
                `-maxrate ${options.videoBitrate}`,
                `-bufsize ${parseInt(options.videoBitrate, 10) * 2}k`,
                `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
                '-c:a aac',
                `-b:a ${options.audioBitrate}`,
                '-ac 2',
                '-f hls',
                `-hls_time ${segmentDuration}`,
                '-hls_playlist_type vod',
                '-hls_flags independent_segments',
                `-hls_segment_filename ${path_1.default.join(qualityDir, 'segment%05d.ts')}`,
            ])
                .on('progress', info => onProgress?.({ percent: info.percent, timemark: info.timemark }))
                .on('end', () => resolve())
                .on('error', err => reject(new Error(`HLS transcode failed (${quality}): ${err.message}`)))
                .run();
        });
    }
    static async generateMasterPlaylist(outputDir, qualities) {
        const masterPath = path_1.default.join(outputDir, 'master.m3u8');
        let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';
        for (const quality of qualities) {
            const options = exports.QUALITY_PRESETS[quality];
            if (!options)
                continue;
            const [width, height] = options.resolution.split('x');
            const bandwidth = parseInt(options.videoBitrate.replace('k', '000')) + parseInt(options.audioBitrate.replace('k', '000'));
            masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}\n`;
            masterContent += `${quality}/index.m3u8\n`;
        }
        await promises_1.default.writeFile(masterPath, masterContent, 'utf-8');
        return 'master.m3u8';
    }
}
exports.TranscodeService = TranscodeService;
