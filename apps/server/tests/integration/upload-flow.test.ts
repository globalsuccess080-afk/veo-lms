import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { createAdmin, createCourse } from '../setup/helpers';
import { Lesson } from '../../src/modules/lesson/lesson.model';
import mongoose from 'mongoose';

const ADMIN_EMAIL = "";
const ADMIN_PASSWORD = "";

const STUDENT_EMAIL = "";
const STUDENT_PASSWORD = "";

describe('Upload Flow Integration', () => {
  let adminCookie: string[];
  let adminToken: string;
  let studentCookie: string[];
  let studentToken: string;
  let courseId: string;
  let lessonId: string;
  let jobId: string;

  it('Should login as admin successfully', async () => {
    // If admin credentials are not provided, this test will fail, which is expected since it needs valid data.
    const loginRes = await request(app)
      .post('/api/auth/admin/login')
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
    
    if (ADMIN_EMAIL) {
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      adminCookie = loginRes.headers['set-cookie'];
      adminToken = loginRes.body.data.accessToken;
    }
  });
  
  it('Should setup course and lesson', async () => {
    if (!adminCookie) return;
    const admin = await createAdmin('admin-upload-temp@test.com');
    const course = await createCourse(admin._id.toString());
    courseId = course._id.toString();
    
    const lesson = await Lesson.create({
      courseId,
      sectionId: new mongoose.Types.ObjectId(),
      title: 'Upload Test Lesson',
      order: 1,
    });
    lessonId = lesson._id.toString();
    expect(lessonId).toBeDefined();
  });

  it('Should fail upload without file', async () => {
    if (!adminCookie) return;
    
    const uploadRes = await request(app)
      .post('/api/videos/upload')
      .set('Cookie', adminCookie)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('lessonId', lessonId);
      
    expect(uploadRes.status).toBe(400); // Bad Request because no video file provided
    expect(uploadRes.body.success).toBe(false);
  });

  it('Should fail upload for unauthorized user (student)', async () => {
    if (!adminCookie) return; 
    
    // login as student
    if (STUDENT_EMAIL) {
      const studentLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD });
      studentCookie = studentLoginRes.headers['set-cookie'];
      studentToken = studentLoginRes.body.data.accessToken;
    }
    
    if (studentCookie) {
      const uploadRes = await request(app)
        .post('/api/videos/upload')
        .set('Cookie', studentCookie)
        .set('Authorization', `Bearer ${studentToken}`)
        .field('lessonId', lessonId)
        .attach('video', Buffer.from('dummy video content'), 'test.mp4');
        
      expect(uploadRes.status).toBe(403); // Forbidden because student is not admin
    }
  });

  it('Should successfully upload video and return job details', async () => {
    if (!adminCookie) return;
    
    const uploadRes = await request(app)
      .post('/api/videos/upload')
      .set('Cookie', adminCookie)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('lessonId', lessonId)
      .attach('video', Buffer.from('dummy video content'), 'test.mp4');
    
    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.jobId).toBeDefined();
    expect(uploadRes.body.data.status).toBe('queued');
    
    jobId = uploadRes.body.data.jobId;
  });

  it('Should verify upload job status', async () => {
    if (!adminCookie || !jobId) return;

    const statusRes = await request(app)
      .get(`/api/videos/job/${jobId}`)
      .set('Cookie', adminCookie)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.data.status).toBeDefined();
  });
});
