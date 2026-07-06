import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { createStudent, login, createAdmin, createCourse } from '../../setup/helpers';

describe('Payment Verification', () => {
  async function createOrderForCourse(token: string, courseId: string) {
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId });

    expect(orderRes.status).toBe(200);
    return orderRes.body.data.orderId as string;
  }

  it('should process a valid payment', async () => {
    await createStudent('pay@test.com');
    const { token } = await login('pay@test.com', 'password123');

    const admin = await createAdmin('admin-pay@test.com');
    const course = await createCourse(admin._id.toString());
    const orderId = await createOrderForCourse(token, course._id.toString());

    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpayOrderId: orderId,
        razorpayPaymentId: 'pay_mock_123',
        razorpaySignature: 'mock_signature',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject a duplicate payment', async () => {
    await createStudent('pay-dup@test.com');
    const { token } = await login('pay-dup@test.com', 'password123');
    const admin = await createAdmin('admin-pay2@test.com');
    const course = await createCourse(admin._id.toString());
    const orderId = await createOrderForCourse(token, course._id.toString());

    const payload = {
      razorpayOrderId: orderId,
      razorpayPaymentId: 'pay_mock_dup',
      razorpaySignature: 'mock_signature',
    };

    await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject an invalid payment signature', async () => {
    await createStudent('pay-inv@test.com');
    const { token } = await login('pay-inv@test.com', 'password123');
    const admin = await createAdmin('admin-pay3@test.com');
    const course = await createCourse(admin._id.toString());
    const orderId = await createOrderForCourse(token, course._id.toString());

    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpayOrderId: orderId,
        razorpayPaymentId: 'pay_mock_123',
        razorpaySignature: 'invalid_signature',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
