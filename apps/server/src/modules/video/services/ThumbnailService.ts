import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export class ThumbnailService {
  /**
   * Generates small, medium, and large thumbnails from the video.
   * Takes the frame at 30% of the video duration as the default sharp frame.
   */
  static async generateThumbnails(videoPath: string, outputDir: string): Promise<{
    small: string;
    medium: string;
    large: string;
  }> {
    await fs.mkdir(outputDir, { recursive: true });

    const source = path.join(outputDir, 'source.jpg');
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({ timestamps: ['30%'], filename: path.basename(source), folder: outputDir, size: '1920x?' })
          .on('end', () => resolve())
        .on('error', err => reject(new Error(`Thumbnail extraction failed: ${err.message}`)));
    });

    const files = { small: 'small.jpg', medium: 'medium.jpg', large: 'large.jpg' };
    await Promise.all([
      sharp(source).resize(320, 180, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(path.join(outputDir, files.small)),
      sharp(source).resize(640, 360, { fit: 'cover' }).jpeg({ quality: 82 }).toFile(path.join(outputDir, files.medium)),
      sharp(source).resize(1280, 720, { fit: 'cover' }).jpeg({ quality: 84 }).toFile(path.join(outputDir, files.large)),
    ]);
    await fs.unlink(source).catch(() => undefined);
    return files;
  }
}
