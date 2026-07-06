import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';

export interface TranscodeOptions {
  resolution: string; // e.g., '640x360'
  videoBitrate: string; // e.g., '700k'
  audioBitrate: string; // e.g., '96k'
}

/**
 * Quality presets for HLS transcoding.
 * Keep this lean for local development — full 4-quality set (add 480p + 1080p)
 * only makes sense when the server has a fast uplink (datacenter / cloud VM).
 * Each extra quality multiplies upload size linearly.
 */
export const QUALITY_PRESETS: Record<string, TranscodeOptions> = {
  '360p':  { resolution: '640x360',   videoBitrate: '600k',  audioBitrate: '96k'  },
  '480p':  { resolution: '854x480',   videoBitrate: '1200k', audioBitrate: '128k' },
  '720p':  { resolution: '1280x720',  videoBitrate: '2000k', audioBitrate: '128k' },
  '1080p': { resolution: '1920x1080', videoBitrate: '4500k', audioBitrate: '192k' },
};

export class TranscodeService {
  static async transcodeAllQualities(
    videoPath: string,
    outputDir: string,
    segmentDuration: number = 4,
    onProgress?: (info: { percent?: number; timemark?: string }) => void
  ): Promise<string[]> {
    const qualities = Object.keys(QUALITY_PRESETS);
    await Promise.all(qualities.map(quality => fs.mkdir(path.join(outputDir, quality), { recursive: true })));

    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(videoPath);
      for (const quality of qualities) {
        const options = QUALITY_PRESETS[quality];
        const qualityDir = path.join(outputDir, quality);
        const [width, height] = options.resolution.split('x');
        command = command
          .output(path.join(qualityDir, 'index.m3u8'))
          .outputOptions([
            '-c:v libx264', '-preset veryfast', '-crf 21',
            `-b:v ${options.videoBitrate}`,
            `-maxrate ${options.videoBitrate}`,
            `-bufsize ${parseInt(options.videoBitrate, 10) * 2}k`,
            `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
            '-c:a aac', `-b:a ${options.audioBitrate}`, '-ac 2',
            '-f hls', `-hls_time ${segmentDuration}`, '-hls_playlist_type vod',
            '-hls_flags independent_segments',
            `-hls_segment_filename ${path.join(qualityDir, 'segment%05d.ts')}`,
          ]);
      }
      command
        .on('progress', info => onProgress?.({ percent: info.percent, timemark: info.timemark }))
        .on('end', () => resolve())
        .on('error', err => reject(new Error(`HLS transcode failed: ${err.message}`)))
        .run();
    });

    await this.generateMasterPlaylist(outputDir, qualities);
    return qualities;
  }

  /**
   * Generates a master playlist (master.m3u8) referencing the generated qualities.
   */
  static async generateMasterPlaylist(
    outputDir: string,
    qualities: string[]
  ): Promise<string> {
    const masterPath = path.join(outputDir, 'master.m3u8');
    let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';

    for (const quality of qualities) {
      const options = QUALITY_PRESETS[quality];
      if (!options) continue;

      const [width, height] = options.resolution.split('x');
      const bandwidth = parseInt(options.videoBitrate.replace('k', '000')) + parseInt(options.audioBitrate.replace('k', '000'));
      
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}\n`;
      masterContent += `${quality}/index.m3u8\n`;
    }

    await fs.writeFile(masterPath, masterContent, 'utf-8');
    return 'master.m3u8';
  }
}
