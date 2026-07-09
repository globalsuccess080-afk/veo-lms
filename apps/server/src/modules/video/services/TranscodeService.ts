import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs/promises'
import path from 'path'
import { env } from '../../../config/env'

export interface TranscodeOptions {
  resolution: string
  videoBitrate: string
  audioBitrate: string
}

export const QUALITY_PRESETS: Record<string, TranscodeOptions> = {
  '360p': { resolution: '640x360', videoBitrate: '600k', audioBitrate: '96k' },
  '480p': { resolution: '854x480', videoBitrate: '1200k', audioBitrate: '128k' },
  '720p': { resolution: '1280x720', videoBitrate: '2000k', audioBitrate: '128k' },
  '1080p': { resolution: '1920x1080', videoBitrate: '4500k', audioBitrate: '192k' },
}

const QUALITY_ORDER = ['360p', '480p', '720p', '1080p'] as const

function presetHeight(quality: string): number {
  const resolution = QUALITY_PRESETS[quality]?.resolution
  if (!resolution) return 0
  return Number(resolution.split('x')[1]) || 0
}

export function resolveQualities(sourceHeight: number): string[] {
  const maxHeight = env.NODE_ENV === 'production'
    ? Math.min(sourceHeight || 720, 720)
    : sourceHeight || 1080

  const selected = QUALITY_ORDER.filter(quality => presetHeight(quality) <= maxHeight)
  return selected.length > 0 ? [...selected] : ['360p']
}

export class TranscodeService {
  static async transcodeAllQualities(
    videoPath: string,
    outputDir: string,
    sourceHeight: number,
    segmentDuration: number = 4,
    onProgress?: (info: { percent?: number; timemark?: string; quality?: string }) => void
  ): Promise<string[]> {
    const qualities = resolveQualities(sourceHeight)
    await fs.mkdir(outputDir, { recursive: true })

    for (let index = 0; index < qualities.length; index++) {
      const quality = qualities[index]
      const qualityDir = path.join(outputDir, quality)
      await fs.mkdir(qualityDir, { recursive: true })
      await this.transcodeQuality(videoPath, qualityDir, quality, segmentDuration, info => {
        const slice = 100 / qualities.length
        const base = index * slice
        const percent = base + Math.min(slice, Math.max(0, (info.percent ?? 0) / 100 * slice))
        onProgress?.({ percent, timemark: info.timemark, quality })
      })
    }

    await this.generateMasterPlaylist(outputDir, qualities)
    return qualities
  }

  private static transcodeQuality(
    videoPath: string,
    qualityDir: string,
    quality: string,
    segmentDuration: number,
    onProgress?: (info: { percent?: number; timemark?: string }) => void
  ): Promise<void> {
    const options = QUALITY_PRESETS[quality]
    const [width, height] = options.resolution.split('x')

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(path.join(qualityDir, 'index.m3u8'))
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
          `-hls_segment_filename ${path.join(qualityDir, 'segment%05d.ts')}`,
        ])
        .on('progress', info => onProgress?.({ percent: info.percent, timemark: info.timemark }))
        .on('end', () => resolve())
        .on('error', err => reject(new Error(`HLS transcode failed (${quality}): ${err.message}`)))
        .run()
    })
  }

  static async generateMasterPlaylist(
    outputDir: string,
    qualities: string[]
  ): Promise<string> {
    const masterPath = path.join(outputDir, 'master.m3u8')
    let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n'

    for (const quality of qualities) {
      const options = QUALITY_PRESETS[quality]
      if (!options) continue

      const [width, height] = options.resolution.split('x')
      const bandwidth = parseInt(options.videoBitrate.replace('k', '000')) + parseInt(options.audioBitrate.replace('k', '000'))

      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}\n`
      masterContent += `${quality}/index.m3u8\n`
    }

    await fs.writeFile(masterPath, masterContent, 'utf-8')
    return 'master.m3u8'
  }
}
