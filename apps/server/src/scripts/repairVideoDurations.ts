import mongoose from 'mongoose'
import { env } from '../config/env'
import { Lesson } from '../modules/lesson/lesson.model'
import { Course } from '../modules/course/course.model'

async function main() {
  await mongoose.connect(env.MONGODB_URI)

  const lessons = await Lesson.find({
    'video.metadata.duration': { $gt: 0 },
  }).select('_id courseId duration video.metadata.duration').lean()

  const repairs = lessons.filter(lesson => (
    lesson.duration !== Math.round(Number(lesson.video.metadata.duration))
  ))

  if (repairs.length) {
    await Lesson.bulkWrite(repairs.map(lesson => ({
      updateOne: {
        filter: { _id: lesson._id },
        update: { $set: { duration: Math.round(Number(lesson.video.metadata.duration)) } },
      },
    })))

    const courseIds = [...new Set(repairs.map(lesson => lesson.courseId.toString()))]
    await Promise.all(courseIds.map(async courseId => {
      const courseLessons = await Lesson.find({ courseId }).select('duration').lean()
      await Course.findByIdAndUpdate(courseId, {
        totalLessons: courseLessons.length,
        totalDuration: courseLessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      })
    }))
  }

  console.log(`Repaired ${repairs.length} uploaded video duration(s).`)
  await mongoose.disconnect()
}

main().catch(async error => {
  console.error(error)
  await mongoose.disconnect().catch(() => undefined)
  process.exit(1)
})
