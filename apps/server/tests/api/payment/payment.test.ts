import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { createStudent, login, createAdmin, createCourse } from '../../setup/helpers';

describe('Payment Status', () => {
  async function createOrderForCourse(token: string, courseId: string) {
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId });

    expect(orderRes.status).toBe(200);
    return orderRes.body.data.orderId as string;
  }

  it('should return completed status for a mock payment order', async () => {
    await createStudent('pay@test.com');
    const { token } = await login('pay@test.com', 'password123');

    const admin = await createAdmin('admin-pay@test.com');
    const course = await createCourse(admin._id.toString());
    const orderId = await createOrderForCourse(token, course._id.toString());

    const res = await request(app)
      .get(`/api/payments/status/${orderId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('should reject creating another paid order for the same course', async () => {
    await createStudent('pay-dup@test.com');
    const { token } = await login('pay-dup@test.com', 'password123');
    const admin = await createAdmin('admin-pay2@test.com');
    const course = await createCourse(admin._id.toString());
    await createOrderForCourse(token, course._id.toString());

    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id.toString() });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject payment status lookup from another user', async () => {
    await createStudent('pay-inv@test.com');
    const { token } = await login('pay-inv@test.com', 'password123');
    await createStudent('pay-other@test.com');
    const other = await login('pay-other@test.com', 'password123');
    const admin = await createAdmin('admin-pay3@test.com');
    const course = await createCourse(admin._id.toString());
    const orderId = await createOrderForCourse(token, course._id.toString());

    const res = await request(app)
      .get(`/api/payments/status/${orderId}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
