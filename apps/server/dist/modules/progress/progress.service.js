"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProgress = updateProgress;
exports.getCourseProgress = getCourseProgress;
exports.getRecent = getRecent;
exports.getLessonProgress = getLessonProgress;
const progress_model_1 = require("./progress.model");
const lesson_model_1 = require("../lesson/lesson.model");
const enrollment_model_1 = require("../enrollment/enrollment.model");
const streak_service_1 = require("../streak/streak.service");
const assetPath_1 = require("../../utils/assetPath");
async function updateProgress(userId, courseId, lessonId, watchedSeconds, totalSeconds, isCompleted) {
    const existing = await progress_model_1.Progress.findOne({ userId, courseId, lessonId });
    const alreadyCompleted = existing?.isCompleted === true;
    const safeTotal = totalSeconds > 0 ? totalSeconds : existing?.totalSeconds || 0;
    // Completion is sticky: once a lesson is completed it never reverts to
    // incomplete from later periodic saves (replays, resumes, etc).
    const completed = alreadyCompleted || isCompleted === true || (safeTotal > 0 && watchedSeconds / safeTotal >= 0.9);
    const progress = await progress_model_1.Progress.findOneAndUpdate({ userId, courseId, lessonId }, {
        watchedSeconds,
        totalSeconds: safeTotal,
        isCompleted: completed,
        completedAt: completed ? existing?.completedAt || new Date() : null,
        lastWatchedAt: new Date()
    }, { upsert: true, new: true });
    if (completed) {
        const totalLessons = await lesson_model_1.Lesson.countDocuments({ courseId });
        const completedLessons = await progress_model_1.Progress.countDocuments({ userId, courseId, isCompleted: true });
        const percent = Math.round((completedLessons / totalLessons) * 100);
        await enrollment_model_1.Enrollment.findOneAndUpdate({ userId, courseId }, { progress: percent });
    }
    // Update Learning Streak
    if (completed || watchedSeconds >= 180) {
        // Fire and forget so we don't block progress update
        (0, streak_service_1.updateLearningStreak)(userId).catch(console.error);
    }
    return {
        id: progress._id.toString(),
        watchedSeconds: progress.watchedSeconds,
        isCompleted: progress.isCompleted
    };
}
async function getCourseProgress(userId, courseId) {
    const progress = await progress_model_1.Progress.find({ userId, courseId }).lean();
    return progress.map(p => ({
        lessonId: p.lessonId.toString(),
        watchedSeconds: p.watchedSeconds,
        totalSeconds: p.totalSeconds,
        isCompleted: p.isCompleted,
        lastWatchedAt: p.lastWatchedAt.toISOString()
    }));
}
async function getRecent(userId) {
    const recent = await progress_model_1.Progress.find({ userId })
        .sort({ lastWatchedAt: -1 })
        .limit(5)
        .populate('lessonId', 'title')
        .populate('courseId', 'title slug thumbnail')
        .lean();
    return recent.map(p => {
        const course = p.courseId;
        if (course?.thumbnail) {
            course.thumbnail = (0, assetPath_1.formatAssetPath)(course.thumbnail);
        }
        return {
            lessonId: p.lessonId,
            courseId: course,
            watchedSeconds: p.watchedSeconds,
            totalSeconds: p.totalSeconds,
            isCompleted: p.isCompleted,
            lastWatchedAt: p.lastWatchedAt.toISOString()
        };
    });
}
async function getLessonProgress(userId, lessonId) {
    const progress = await progress_model_1.Progress.findOne({ userId, lessonId }).lean();
    if (!progress)
        return { watchedSeconds: 0, isCompleted: false };
    return {
        watchedSeconds: progress.watchedSeconds,
        isCompleted: progress.isCompleted
    };
}
