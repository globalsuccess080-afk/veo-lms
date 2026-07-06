import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../../src/app';
import { createStudent, login, createAdmin, createCourse } from '../../setup/helpers';
import { Lesson } from '../../../src/modules/lesson/lesson.model';
import { Enrollment } from '../../../src/modules/enrollment/enrollment.model';

async function createLesson(course: Awaited<ReturnType<typeof createCourse>>, isPreview = false) {
  const sectionId = new Types.ObjectId();
  course.sections = [{ _id: sectionId, title: 'Section 1', order: 0, lessons: [] }];
  await course.save();

  return Lesson.create({
    courseId: course._id,
    sectionId,
    title: isPreview ? 'Preview Lesson' : 'Paid Lesson',
    order: 0,
    duration: 600,
    isPreview,
    video: {
      status: 'ready',
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
  });
}

describe('Lesson Access', () => {
  it('Enrolled student can access lesson content', async () => {
    const student = await createStudent('enrolled@test.com');
    const { token } = await login('enrolled@test.com', 'password123');
    const admin = await createAdmin('admin-enroll@test.com');
    const course = await createCourse(admin._id.toString());
    const lesson = await createLesson(course);

    await Enrollment.create({
      userId: student._id,
      courseId: course._id,
      isActive: true,
      progress: 0,
    });

    const res = await request(app)
      .get(`/api/lessons/${lesson._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Paid Lesson');
  });

  it('Non-enrolled student cannot access lesson content', async () => {
    await createStudent('not-enrolled@test.com');
    const { token } = await login('not-enrolled@test.com', 'password123');
    const admin = await createAdmin('admin-not-enrolled@test.com');
    const course = await createCourse(admin._id.toString());
    const lesson = await createLesson(course);

    const res = await request(app)
      .get(`/api/lessons/${lesson._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Any user can access a preview lesson', async () => {
    await createStudent('preview@test.com');
    const { token } = await login('preview@test.com', 'password123');
    const admin = await createAdmin('admin-preview@test.com');
    const course = await createCourse(admin._id.toString());
    const lesson = await createLesson(course, true);

    const res = await request(app)
      .get(`/api/lessons/${lesson._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isPreview).toBe(true);
  });
});
