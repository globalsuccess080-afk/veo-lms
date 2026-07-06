import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

const ADMIN_EMAIL = "";
const ADMIN_PASSWORD = "";

const STUDENT_EMAIL = "";
const STUDENT_PASSWORD = "";

describe('Auth Flow Integration', () => {
  let cookie: string[];
  let accessToken: string;

  it('Should fail login with invalid credentials', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid-email-not-found@test.com',
        password: 'wrongpassword',
      });
    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
  });

  it('Should login successfully with student credentials', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: STUDENT_EMAIL,
        password: STUDENT_PASSWORD,
      });
    if (STUDENT_EMAIL) {
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.accessToken).toBeDefined();
      expect(loginRes.body.data.user).toBeDefined();

      cookie = loginRes.headers['set-cookie'];
      accessToken = loginRes.body.data.accessToken;
      expect(cookie).toBeDefined();
    }
  });

  it('Should access authenticated profile route', async () => {
    if (!cookie) return;

    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data.email).toBe(STUDENT_EMAIL);
  });

  it('Should fail to access profile with invalid token', async () => {
    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['refreshToken=invalidtoken'])
      .set('Authorization', 'Bearer invalidtoken')
      .send();

    expect(profileRes.status).toBe(401);
    expect(profileRes.body.success).toBe(false);
  });

  it('Should logout successfully', async () => {
    if (!cookie) return;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    expect(logoutRes.body.message).toBe('Logged out');
  });
});
