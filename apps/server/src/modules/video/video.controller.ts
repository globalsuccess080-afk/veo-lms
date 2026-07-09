import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/apiResponse'
import { ApiError } from '../../utils/apiError'
import { Lesson } from '../lesson/lesson.model'
import { videoQueue, videoUploadQueue } from '../../config/bullmq'
import { storageService } from '../../storage/StorageService'
import { formatAssetPath } from '../../utils/assetPath'
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'
import { param } from '../../utils/params'
import { getVideoUrl } from '../lesson/lesson.service'
import { buildAuthorizedPlaylist } from './video.delivery'

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No video file provided')

  const lessonId = String(req.body.lessonId || '')
  if (!lessonId) {
    await fs.unlink(req.file.path).catch(() => undefined)
    throw new ApiError(400, 'lessonId is required')
  }

  const lesson = await Lesson.findById(lessonId)
  if (!lesson) {
    await fs.unlink(req.file.path).catch(() => undefined)
    throw new ApiError(404, 'Lesson not found')
  }

  const previousJobId = lesson.video.jobId
  if (previousJobId) {
    const previousJob = await videoQueue.getJob(previousJobId).catch(() => null)
    const previousState = await previousJob?.getState().catch(() => null)
    if (previousJob && previousState && ['waiting', 'delayed', 'prioritized'].includes(previousState)) {
      await previousJob.remove().catch(() => undefined)
    }
  }

  const jobId = randomUUID()
  lesson.video.status = 'queued'
  lesson.video.stage = 'QUEUED'
  lesson.video.message = 'Uploading video to storage'
  lesson.video.progress = 0
  lesson.video.storageProvider = 'r2'
  lesson.video.jobId = jobId
  lesson.video.failedReason = ''
  await lesson.save()

  const ext = req.file.originalname
    ? path.extname(req.file.originalname).toLowerCase() || '.mp4'
    : '.mp4'
  const videoR2Key = `source-videos/${lessonId}/${jobId}${ext}`

  try {
    await storageService.uploadFile(req.file.path, videoR2Key)
  } catch (uploadError) {
    await fs.unlink(req.file.path).catch(() => undefined)
    lesson.video.status = 'failed'
    lesson.video.stage = 'FAILED'
    lesson.video.message = 'Failed to upload video to storage'
    await lesson.save()
    throw uploadError
  }

  await fs.unlink(req.file.path).catch(() => undefined)

  lesson.video.message = 'Waiting for an available transcoder'
  await lesson.save()

  try {
    await videoQueue.add('transcode', {
      lessonId, videoR2Key, userId: req.user?.id,
    }, {
      jobId, priority: 1, attempts: 1, removeOnComplete: false, removeOnFail: false,
    })
  } catch (error) {
    await storageService.deleteFile(videoR2Key).catch(() => undefined)
    lesson.video.status = 'failed'
    lesson.video.stage = 'FAILED'
    lesson.video.message = 'Could not queue video processing'
    await lesson.save()
    throw error
  }

  sendSuccess(
    res,
    { jobId, status: 'queued', lessonId },
    'Video uploaded and queued for processing successfully',
    201
  )
})

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file provided')

  const key = `images/${req.file.filename}`
  const result = await storageService.uploadFile(req.file.path, key)

  await fs.unlink(req.file.path).catch(() => {})

  sendSuccess(res, { path: formatAssetPath(result.key), key: result.key, fileName: req.file.filename, size: req.file.size }, 'Image uploaded successfully', 201)
})

export const uploadResource = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file provided')

  const key = `resources/${req.file.filename}`
  await storageService.uploadFile(req.file.path, key)

  await fs.unlink(req.file.path).catch(() => {})

  sendSuccess(
    res,
    { path: formatAssetPath(key), key, fileName: req.file.originalname, size: req.file.size, type: req.file.mimetype },
    'Resource uploaded successfully',
    201
  )
})

export const jobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params
  const id = Array.isArray(jobId) ? jobId[0] : jobId
  const job = await videoQueue.getJob(id) ?? await videoUploadQueue.getJob(id)

  if (!job) {
    throw new ApiError(404, 'Job not found')
  }
  const state = await job.getState()
  const progress = job.progress

  sendSuccess(res, { status: state, progress })
})

export const playVideo = asyncHandler(async (req, res) => {
  const lessonId = param(req.params.lessonId)
  const video = await getVideoUrl(lessonId, req.user!.id, req.user!.role)
  if (video.status !== 'ready' || !video.playlistPath) {
    throw new ApiError(400, 'Video is not ready yet')
  }
  sendSuccess(res, video)
})

export const playlist = asyncHandler(async (req, res) => {
  const wildcard = req.params.path
  const requestedPath = Array.isArray(wildcard) ? wildcard.join('/') : String(wildcard || '')
  const token = typeof req.query.token === 'string' ? req.query.token : ''
  if (!token) throw new ApiError(401, 'Video access token is required')
  const content = await buildAuthorizedPlaylist(requestedPath, token)
  res.set({
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Cache-Control': 'private, no-store, max-age=0',
    Pragma: 'no-cache',
  })
  res.status(200).send(content)
})

export const lessonProgress = asyncHandler(async (req, res) => {
  const lessonId = param(req.params.lessonId)
  const lesson = await Lesson.findById(lessonId).lean()
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  sendSuccess(res, {
    lessonId,
    status: lesson.video.status,
    progress: lesson.video.progress ?? 0,
    stage: lesson.video.stage,
    message: lesson.video.message,
    etaSeconds: lesson.video.etaSeconds,
    currentQuality: lesson.video.currentQuality,
    completedQualities: lesson.video.completedQualities,
    failedReason: lesson.video.failedReason,
    jobId: lesson.video.jobId,
  })
})
