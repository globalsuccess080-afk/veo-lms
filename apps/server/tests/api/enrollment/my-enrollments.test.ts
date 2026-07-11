import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { Types } from 'mongoose'
import app from '../../../src/app'
import { createAdmin, createCourse, createStudent, login } from '../../setup/helpers'
import { Enrollment } from '../../../src/modules/enrollment/enrollment.model'
import { Lesson } from '../../../src/modules/lesson/lesson.model'
import { Progress } from '../../../src/modules/progress/progress.model'

describe('My Enrollments', () => {
  it('returns live progress when new lessons are added after completion', async () => {
    const student = await createStudent('my-progress@test.com')
    const { token } = await login('my-progress@test.com', 'password123')
    const admin = await createAdmin('admin-my-progress@test.com')
    const sectionId = new Types.ObjectId()
    const course = await createCourse(admin._id.toString(), {
      totalLessons: 3,
      sections: [{ _id: sectionId, title: 'Section 1', order: 0, lessons: [] }],
    })

    const lessons = await Lesson.create([
      { courseId: course._id, sectionId, title: 'Lesson 1', order: 0, duration: 60 },
      { courseId: course._id, sectionId, title: 'Lesson 2', order: 1, duration: 60 },
      { courseId: course._id, sectionId, title: 'Lesson 3', order: 2, duration: 60 },
    ])

    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      isActive: true,
      progress: 100,
      completedAt: new Date(),
    })

    await Progress.create([
      { userId: student._id, courseId: course._id, lessonId: lessons[0]._id, watchedSeconds: 60, totalSeconds: 60, isCompleted: true },
      { userId: student._id, courseId: course._id, lessonId: lessons[1]._id, watchedSeconds: 60, totalSeconds: 60, isCompleted: true },
    ])

    const res = await request(app)
      .get('/api/enrollments/my')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data[0].progress).toBe(67)
    expect(res.body.data[0].completedAt).toBeNull()
    expect(res.body.data[0].course.totalLessons).toBe(3)

    const enrollment = await Enrollment.findOne({ userId: student._id, courseId: course._id }).lean()
    expect(enrollment?.progress).toBe(67)
    expect(enrollment?.completedAt).toBeNull()
  })
})
