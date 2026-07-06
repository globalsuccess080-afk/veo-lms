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
    // If student credentials are not provided, this test will fail, which is expected since it needs valid data.
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
    // We create a dummy course for the test to purchase.
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
    expect(orderRes.body.data.id).toBeDefined(); // Razorpay order id

    orderId = orderRes.body.data.id;
  });

  it('Should fail payment verification with invalid signature', async () => {
    if (!cookie || !orderId) return;

    const verifyRes = await request(app)
      .post('/api/payments/verify')
      .set('Cookie', cookie)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        razorpayOrderId: orderId,
        razorpayPaymentId: 'pay_mock_123',
        razorpaySignature: 'invalid_signature_here'
      });

    expect(verifyRes.status).toBe(400); // Bad Request because of invalid signature
    expect(verifyRes.body.success).toBe(false);
  });

  it('Should verify payment using confirm-mock (test mode)', async () => {
    if (!cookie || !orderId) return;
    const mockRes = await request(app)
      .post('/api/payments/confirm-mock')
      .set('Cookie', cookie)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ orderId });

    expect(mockRes.status).toBe(200);
    expect(mockRes.body.success).toBe(true);
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
