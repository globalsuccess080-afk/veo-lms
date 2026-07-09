import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

if (ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path)
}
