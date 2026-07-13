import { Lesson, ILesson } from './lesson.model'
import { Course } from '../course/course.model'
import { Enrollment } from '../enrollment/enrollment.model'
import { ApiError } from '../../utils/apiError'
import { CreateLessonInput } from '@veolms/shared'
import { recalcStats } from '../course/course.service'
import { findSection } from '../../utils/sections'
import { Types } from 'mongoose'
import { videoQueue, videoUploadQueue } from '../../config/bullmq'
import { createVideoToken } from '../video/video.delivery'
import { env } from '../../config/env'
import { formatAssetPath } from '../../utils/assetPath'

function formatLesson(lesson: ILesson) {
  const video = lesson.video ? { ...lesson.video } : ({} as any)
  if (typeof video.fileUrl === 'string' && /^https?:\/\//i.test(video.fileUrl)) {
    try {
      video.fileUrl = decodeURIComponent(new URL(video.fileUrl).pathname).replace(/^\//, '')
    } catch {
      video.fileUrl = ''
    }
  }
  const metadataDuration = Number((lesson.video as any)?.metadata?.duration)
  const duration = !lesson.video?.youtubeUrl && Number.isFinite(metadataDuration) && metadataDuration > 0
    ? Math.round(metadataDuration)
    : Number.isFinite(lesson.duration) && lesson.duration > 0
      ? lesson.duration
      : 0
  if (!video.fileUrl && video.status !== 'pending' && !video.youtubeUrl) {
    video.fileUrl = video.storagePath || video.masterPlaylistKey || video.originalKey || 'uploaded'
  }

  return {
    id: lesson._id.toString(),
    courseId: lesson.courseId.toString(),
    sectionId: lesson.sectionId.toString(),
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    duration,
    isPreview: lesson.isPreview,
    video,
    resources: (lesson.resources || []).map((r) => ({
      ...r,
      url: formatAssetPath(r.url),
    })),
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString()
  }
}

async function checkAccess(userId: string | undefined, userRole: string | undefined, lesson: ILesson) {
  if (userRole === 'admin') return true
  if (lesson.isPreview) return true
  if (!userId) throw new ApiError(401, 'Authentication required')
  const enrollment = await Enrollment.findOne({ userId, courseId: lesson.courseId, isActive: true })
  if (!enrollment) throw new ApiError(403, 'Enrollment required')
  return true
}

export async function getLesson(id: string, userId?: string, userRole?: string) {
  const lesson = await Lesson.findById(id).lean()
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await checkAccess(userId, userRole, lesson as unknown as ILesson)
  return formatLesson(lesson as unknown as ILesson)
}

export async function createLesson(courseId: string, sectionId: string, data: CreateLessonInput) {
  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')

  const section = findSection(course.sections, sectionId)
  if (!section) throw new ApiError(404, 'Section not found')

  const { youtubeUrl, fileUrl, ...rest } = data
  const hasVideo = Boolean(youtubeUrl || fileUrl)
  const lesson = await Lesson.create({
    courseId,
    sectionId,
    ...rest,
    video: {
      status: hasVideo ? 'ready' : 'pending',
      youtubeUrl: youtubeUrl || '',
      fileUrl: fileUrl || ''
    }
  })

  section.lessons.push(lesson._id)
  await course.save()
  await recalcStats(courseId)

  return formatLesson(lesson)
}

export async function updateLesson(id: string, data: Partial<CreateLessonInput>) {
  const update: Record<string, unknown> = { ...data }
  if (!data.youtubeUrl) {
    const existing = await Lesson.findById(id).select('video.metadata.duration').lean()
    const metadataDuration = Number((existing?.video as any)?.metadata?.duration)
    if (Number.isFinite(metadataDuration) && metadataDuration > 0) {
      update.duration = Math.round(metadataDuration)
    }
  }
  if (data.youtubeUrl) {
    update['video.youtubeUrl'] = data.youtubeUrl
    update['video.fileUrl'] = ''
    update['video.status'] = 'ready'
    delete update.youtubeUrl
  }
  if (data.fileUrl) {
    update['video.fileUrl'] = data.fileUrl
    update['video.youtubeUrl'] = ''
    update['video.status'] = 'ready'
    delete update.fileUrl
  }
  const lesson = await Lesson.findByIdAndUpdate(id, update, { new: true })
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await recalcStats(lesson.courseId.toString())
  return formatLesson(lesson)
}

export async function deleteLesson(id: string) {
  const lesson = await Lesson.findByIdAndDelete(id)
  if (!lesson) throw new ApiError(404, 'Lesson not found')

  if (lesson.video?.jobId) {
    const job = await videoQueue.getJob(lesson.video.jobId).catch(() => null)
    if (job) {
      const state = await job.getState().catch(() => null)
      if (state && state !== 'completed') {
        await job.remove().catch(() => {})
      }
    }
  }

  const uploadJobs = await videoUploadQueue.getJobs(['waiting', 'active', 'delayed'])
  await Promise.all(uploadJobs.filter(job => job.data.lessonId === id).map(job => job.remove().catch(() => undefined)))

  const course = await Course.findById(lesson.courseId)
  if (course) {
    const section = findSection(course.sections, lesson.sectionId.toString())
    if (section) {
      section.lessons = section.lessons.filter((l: Types.ObjectId) => l.toString() !== id)
      await course.save()
    }
    await recalcStats(lesson.courseId.toString())
  }
}

export async function getLessonsByCourse(courseId: string) {
  const lessons = await Lesson.find({ courseId }).sort({ order: 1 }).lean()
  return lessons.map(l => formatLesson(l as unknown as ILesson))
}

export async function getVideoUrl(id: string, userId?: string, userRole?: string) {
  const lesson = await Lesson.findById(id)
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await checkAccess(userId, userRole, lesson)
  
  const masterPlaylistKey = lesson.video.masterPlaylistKey
  const storagePath = lesson.video.storagePath || masterPlaylistKey.replace(/\/master\.m3u8$/, '')
  const playlistPath = storagePath ? `${storagePath}/master.m3u8` : ''
  const token = playlistPath ? createVideoToken({
    userId: userId || 'preview',
    lessonId: lesson.id,
    courseId: lesson.courseId.toString(),
    storagePath,
    version: lesson.video.version || storagePath.split('/').at(-2) || '',
  }) : ''

  const thumbnail = {
    small: formatAssetPath(lesson.video.thumbnail?.small || ''),
    medium: formatAssetPath(lesson.video.thumbnail?.medium || ''),
    large: formatAssetPath(lesson.video.thumbnail?.large || ''),
  }

  return {
    youtubeUrl: lesson.video.youtubeUrl,
    playlistPath,
    storagePath,
    token,
    expiresIn: env.VIDEO_TOKEN_EXPIRY_SECONDS,
    thumbnail,
    thumbnailUrl: thumbnail.medium || thumbnail.large || thumbnail.small,
    status: lesson.video.status,
    progress: lesson.video.progress || 0
  }
}
