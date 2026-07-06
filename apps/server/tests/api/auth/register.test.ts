import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { createStudent } from '../../setup/helpers';

describe('Authentication - Register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        otp: '123456'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('should return error for duplicate email', async () => {
    await createStudent('duplicate@test.com');

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'duplicate@test.com',
        password: 'password123',
        otp: '123456'
      });

    expect(res.status).toBe(409);  
    expect(res.body.success).toBe(false);
  });

  it('should return error for invalid request payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'No Email User',
        password: '12', // Too short password
        otp: '123456'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
