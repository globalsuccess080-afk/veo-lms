import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { createAdmin, createStudent, login, createCourse } from '../../setup/helpers';

describe('Course Management', () => {
  it('Admin can create course', async () => {
    const admin = await createAdmin('admin-course@test.com');
    const { token } = await login('admin-course@test.com', 'password123', true);

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Admin Course',
        description: 'Test Description',
        shortDescription: 'Short description for this course',
        category: 'Development',
        instructor: { name: 'Admin Instructor' },
        price: 99,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('Student cannot create course', async () => {
    const student = await createStudent('student-course@test.com');
    const { token } = await login('student-course@test.com', 'password123');

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Student Course',
        description: 'Test Description',
        shortDescription: 'Short description for this course',
        category: 'Development',
        instructor: { name: 'Student Instructor' },
        price: 99,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Public can view published course', async () => {
    const admin = await createAdmin('admin-course2@test.com');
    const course = await createCourse(admin._id.toString(), { status: 'published' });

    const res = await request(app)
      .get(`/api/courses/${course.slug}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Course');
  });
});
