"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const lesson_model_1 = require("../modules/lesson/lesson.model");
const course_model_1 = require("../modules/course/course.model");
async function main() {
    await mongoose_1.default.connect(env_1.env.MONGODB_URI);
    const lessons = await lesson_model_1.Lesson.find({
        'video.metadata.duration': { $gt: 0 },
    }).select('_id courseId duration video.metadata.duration').lean();
    const repairs = lessons.filter(lesson => (lesson.duration !== Math.round(Number(lesson.video.metadata.duration))));
    if (repairs.length) {
        await lesson_model_1.Lesson.bulkWrite(repairs.map(lesson => ({
            updateOne: {
                filter: { _id: lesson._id },
                update: { $set: { duration: Math.round(Number(lesson.video.metadata.duration)) } },
            },
        })));
        const courseIds = [...new Set(repairs.map(lesson => lesson.courseId.toString()))];
        await Promise.all(courseIds.map(async (courseId) => {
            const courseLessons = await lesson_model_1.Lesson.find({ courseId }).select('duration').lean();
            await course_model_1.Course.findByIdAndUpdate(courseId, {
                totalLessons: courseLessons.length,
                totalDuration: courseLessons.reduce((sum, lesson) => sum + lesson.duration, 0),
            });
        }));
    }
    console.log(`Repaired ${repairs.length} uploaded video duration(s).`);
    await mongoose_1.default.disconnect();
}
main().catch(async (error) => {
    console.error(error);
    await mongoose_1.default.disconnect().catch(() => undefined);
    process.exit(1);
});
