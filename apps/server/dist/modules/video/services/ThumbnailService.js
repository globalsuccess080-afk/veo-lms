"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThumbnailService = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
class ThumbnailService {
    /**
     * Generates small, medium, and large thumbnails from the video.
     * Takes the frame at 30% of the video duration as the default sharp frame.
     */
    static async generateThumbnails(videoPath, outputDir) {
        await promises_1.default.mkdir(outputDir, { recursive: true });
        const source = path_1.default.join(outputDir, 'source.jpg');
        await new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(videoPath)
                .screenshots({ timestamps: ['30%'], filename: path_1.default.basename(source), folder: outputDir, size: '1920x?' })
                .on('end', () => resolve())
                .on('error', err => reject(new Error(`Thumbnail extraction failed: ${err.message}`)));
        });
        const files = { small: 'small.jpg', medium: 'medium.jpg', large: 'large.jpg' };
        await Promise.all([
            (0, sharp_1.default)(source).resize(320, 180, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(path_1.default.join(outputDir, files.small)),
            (0, sharp_1.default)(source).resize(640, 360, { fit: 'cover' }).jpeg({ quality: 82 }).toFile(path_1.default.join(outputDir, files.medium)),
            (0, sharp_1.default)(source).resize(1280, 720, { fit: 'cover' }).jpeg({ quality: 84 }).toFile(path_1.default.join(outputDir, files.large)),
        ]);
        await promises_1.default.unlink(source).catch(() => undefined);
        return files;
    }
}
exports.ThumbnailService = ThumbnailService;
