"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataService = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
class MetadataService {
    /**
     * Extracts metadata from a video file using ffprobe.
     */
    static async extractMetadata(videoPath) {
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    return reject(new Error(`FFprobe error: ${err.message}`));
                }
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                if (!videoStream) {
                    return reject(new Error('No video stream found'));
                }
                // Calculate FPS
                let fps = 0;
                if (videoStream.r_frame_rate) {
                    const [num, den] = videoStream.r_frame_rate.split('/');
                    if (num && den && parseInt(den) > 0) {
                        fps = Math.round(parseInt(num) / parseInt(den));
                    }
                }
                resolve({
                    duration: metadata.format.duration || 0,
                    width: videoStream.width || 0,
                    height: videoStream.height || 0,
                    fps,
                    codec: videoStream.codec_name || 'unknown',
                    bitrate: Number(metadata.format.bit_rate) || 0
                });
            });
        });
    }
}
exports.MetadataService = MetadataService;
