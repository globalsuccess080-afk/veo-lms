import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { createStudent } from '../../setup/helpers';

describe('Authentication - Login', () => {
  it('should login successfully with valid credentials', async () => {
    await createStudent('login@test.com', 'password123');
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('should return error for wrong password', async () => {
    await createStudent('wrong@test.com', 'password123');

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@test.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return error for missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'missing@test.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
