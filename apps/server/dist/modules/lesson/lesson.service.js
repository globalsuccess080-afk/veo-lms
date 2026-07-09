"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLesson = getLesson;
exports.createLesson = createLesson;
exports.updateLesson = updateLesson;
exports.deleteLesson = deleteLesson;
exports.getLessonsByCourse = getLessonsByCourse;
exports.getVideoUrl = getVideoUrl;
const lesson_model_1 = require("./lesson.model");
const course_model_1 = require("../course/course.model");
const enrollment_model_1 = require("../enrollment/enrollment.model");
const apiError_1 = require("../../utils/apiError");
const course_service_1 = require("../course/course.service");
const sections_1 = require("../../utils/sections");
const bullmq_1 = require("../../config/bullmq");
const video_delivery_1 = require("../video/video.delivery");
const env_1 = require("../../config/env");
const assetPath_1 = require("../../utils/assetPath");
function formatLesson(lesson) {
    const video = lesson.video ? { ...lesson.video } : {};
    if (typeof video.fileUrl === 'string' && /^https?:\/\//i.test(video.fileUrl)) {
        try {
            video.fileUrl = decodeURIComponent(new URL(video.fileUrl).pathname).replace(/^\//, '');
        }
        catch {
            video.fileUrl = '';
        }
    }
    const metadataDuration = Number(lesson.video?.metadata?.duration);
    const duration = !lesson.video?.youtubeUrl && Number.isFinite(metadataDuration) && metadataDuration > 0
        ? Math.round(metadataDuration)
        : Number.isFinite(lesson.duration) && lesson.duration > 0
            ? lesson.duration
            : 0;
    if (!video.fileUrl && video.status !== 'pending' && !video.youtubeUrl) {
        video.fileUrl = video.storagePath || video.masterPlaylistKey || video.originalKey || 'uploaded';
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
            url: (0, assetPath_1.formatAssetPath)(r.url),
        })),
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString()
    };
}
async function checkAccess(userId, userRole, lesson) {
    if (userRole === 'admin')
        return true;
    if (lesson.isPreview)
        return true;
    if (!userId)
        throw new apiError_1.ApiError(401, 'Authentication required');
    const enrollment = await enrollment_model_1.Enrollment.findOne({ userId, courseId: lesson.courseId, isActive: true });
    if (!enrollment)
        throw new apiError_1.ApiError(403, 'Enrollment required');
    return true;
}
async function getLesson(id, userId, userRole) {
    const lesson = await lesson_model_1.Lesson.findById(id).lean();
    if (!lesson)
        throw new apiError_1.ApiError(404, 'Lesson not found');
    await checkAccess(userId, userRole, lesson);
    return formatLesson(lesson);
}
async function createLesson(courseId, sectionId, data) {
    const course = await course_model_1.Course.findById(courseId);
    if (!course)
        throw new apiError_1.ApiError(404, 'Course not found');
    const section = (0, sections_1.findSection)(course.sections, sectionId);
    if (!section)
        throw new apiError_1.ApiError(404, 'Section not found');
    const { youtubeUrl, fileUrl, ...rest } = data;
    const hasVideo = Boolean(youtubeUrl || fileUrl);
    const lesson = await lesson_model_1.Lesson.create({
        courseId,
        sectionId,
        ...rest,
        video: {
            status: hasVideo ? 'ready' : 'pending',
            youtubeUrl: youtubeUrl || '',
            fileUrl: fileUrl || ''
        }
    });
    section.lessons.push(lesson._id);
    await course.save();
    await (0, course_service_1.recalcStats)(courseId);
    return formatLesson(lesson);
}
async function updateLesson(id, data) {
    const update = { ...data };
    // Uploaded videos are probed by ffmpeg, making their metadata authoritative.
    // An admin form can stay open while processing finishes, then submit a stale
    // zero. Do not let that erase the duration discovered by the worker.
    if (!data.youtubeUrl) {
        const existing = await lesson_model_1.Lesson.findById(id).select('video.metadata.duration').lean();
        const metadataDuration = Number(existing?.video?.metadata?.duration);
        if (Number.isFinite(metadataDuration) && metadataDuration > 0) {
            update.duration = Math.round(metadataDuration);
        }
    }
    if (data.youtubeUrl) {
        update['video.youtubeUrl'] = data.youtubeUrl;
        update['video.fileUrl'] = '';
        update['video.status'] = 'ready';
        delete update.youtubeUrl;
    }
    if (data.fileUrl) {
        update['video.fileUrl'] = data.fileUrl;
        update['video.youtubeUrl'] = '';
        update['video.status'] = 'ready';
        delete update.fileUrl;
    }
    const lesson = await lesson_model_1.Lesson.findByIdAndUpdate(id, update, { new: true });
    if (!lesson)
        throw new apiError_1.ApiError(404, 'Lesson not found');
    await (0, course_service_1.recalcStats)(lesson.courseId.toString());
    return formatLesson(lesson);
}
async function deleteLesson(id) {
    const lesson = await lesson_model_1.Lesson.findByIdAndDelete(id);
    if (!lesson)
        throw new apiError_1.ApiError(404, 'Lesson not found');
    // Cancel any pending/active BullMQ transcode jobs for this lesson
    // so stale retries don't crash with ENOENT on cleaned-up temp files
    if (lesson.video?.jobId) {
        const job = await bullmq_1.videoQueue.getJob(lesson.video.jobId).catch(() => null);
        if (job) {
            const state = await job.getState().catch(() => null);
            if (state && state !== 'completed') {
                await job.remove().catch(() => { });
                console.log(`[deleteLesson] Cancelled job ${lesson.video.jobId} for deleted lesson ${id}`);
            }
        }
    }
    const uploadJobs = await bullmq_1.videoUploadQueue.getJobs(['waiting', 'active', 'delayed']);
    await Promise.all(uploadJobs.filter(job => job.data.lessonId === id).map(job => job.remove().catch(() => undefined)));
    const course = await course_model_1.Course.findById(lesson.courseId);
    if (course) {
        const section = (0, sections_1.findSection)(course.sections, lesson.sectionId.toString());
        if (section) {
            section.lessons = section.lessons.filter((l) => l.toString() !== id);
            await course.save();
        }
        await (0, course_service_1.recalcStats)(lesson.courseId.toString());
    }
}
async function getLessonsByCourse(courseId) {
    const lessons = await lesson_model_1.Lesson.find({ courseId }).sort({ order: 1 }).lean();
    return lessons.map(l => formatLesson(l));
}
async function getVideoUrl(id, userId, userRole) {
    const lesson = await lesson_model_1.Lesson.findById(id);
    if (!lesson)
        throw new apiError_1.ApiError(404, 'Lesson not found');
    await checkAccess(userId, userRole, lesson);
    const masterPlaylistKey = lesson.video.masterPlaylistKey;
    const storagePath = lesson.video.storagePath || masterPlaylistKey.replace(/\/master\.m3u8$/, '');
    const playlistPath = storagePath ? `${storagePath}/master.m3u8` : '';
    const token = playlistPath ? (0, video_delivery_1.createVideoToken)({
        userId,
        lessonId: lesson.id,
        courseId: lesson.courseId.toString(),
        storagePath,
        version: lesson.video.version || storagePath.split('/').at(-2) || '',
    }) : '';
    const thumbnail = {
        small: (0, assetPath_1.formatAssetPath)(lesson.video.thumbnail?.small || ''),
        medium: (0, assetPath_1.formatAssetPath)(lesson.video.thumbnail?.medium || ''),
        large: (0, assetPath_1.formatAssetPath)(lesson.video.thumbnail?.large || ''),
    };
    return {
        youtubeUrl: lesson.video.youtubeUrl,
        playlistPath,
        storagePath,
        token,
        expiresIn: env_1.env.VIDEO_TOKEN_EXPIRY_SECONDS,
        thumbnail,
        thumbnailUrl: thumbnail.medium || thumbnail.large || thumbnail.small,
        status: lesson.video.status,
        progress: lesson.video.progress || 0
    };
}
