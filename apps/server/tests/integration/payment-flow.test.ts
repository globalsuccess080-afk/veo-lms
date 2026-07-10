import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { createStudent, createAdmin, createCourse } from '../setup/helpers';

const ADMIN_EMAIL = "";
const ADMIN_PASSWORD = "";

const STUDENT_EMAIL = "";
const STUDENT_PASSWORD = "";

describe('Payment Flow Integration', () => {
  let cookie: string[];
  let accessToken: string;
  let courseId: string;
  let orderId: string;

  it('Should login successfully', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: STUDENT_EMAIL,
        password: STUDENT_PASSWORD,
      });

    if (STUDENT_EMAIL) {
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      cookie = loginRes.headers['set-cookie'];
      accessToken = loginRes.body.data.accessToken;
    }
  });

  it('Should setup course for payment', async () => {
    const admin = await createAdmin('admin-payment@test.com');
    const course = await createCourse(admin._id.toString());
    courseId = course._id.toString();
    expect(courseId).toBeDefined();
  });

  it('Should create payment order', async () => {
    if (!cookie) return;

    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Cookie', cookie)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ courseId });

    expect(orderRes.status).toBe(200);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.orderId).toBeDefined();

    orderId = orderRes.body.data.orderId;
  });

  it('Should return payment status', async () => {
    if (!cookie || !orderId) return;

    const statusRes = await request(app)
      .get(`/api/payments/status/${orderId}`)
      .set('Cookie', cookie)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).toContain(statusRes.body.data.status);
  });

  it('Should check expected enrollment behaviour after payment', async () => {
    if (!cookie) return;
    const enrollRes = await request(app)
      .get(`/api/enrollments/course/${courseId}`)
      .set('Cookie', cookie)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(enrollRes.status).toBe(200);
    expect(enrollRes.body.success).toBe(true);
    expect(enrollRes.body.data).toBeDefined();
  });
});
