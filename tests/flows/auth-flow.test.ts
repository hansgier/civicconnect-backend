import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { cleanDatabase } from '../helpers/db.helper';
import { prisma } from '../../src/config/database';
import crypto from 'crypto';

describe('Flow: Auth Flow', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should complete a full auth flow', async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Flow User',
        email: 'flow@example.com',
        password: 'password123',
      });
    expect(registerRes.status).toBe(201);
    
    // We need to get the RAW token because it's hashed in the DB.
    // Since we mock pg-boss, we can't easily get it from the job.
    // Let's set a known token in the DB for the test.
    const rawToken = 'known-verification-token';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    await prisma.user.update({
      where: { email: 'flow@example.com' },
      data: {
        verificationToken: hashedToken,
        verificationTokenExp: new Date(Date.now() + 3600000)
      }
    });

    // 2. Verify email
    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: rawToken });
    expect(verifyRes.status).toBe(200);

    // 3. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'flow@example.com',
        password: 'password123',
      });
    expect(loginRes.status).toBe(200);
    
    const cookies = loginRes.headers['set-cookie'];
    const accessToken = cookies.find((c: string) => c.startsWith('access_token='))?.split(';')[0].split('=')[1];
    const refreshToken = cookies.find((c: string) => c.startsWith('refresh_token='))?.split(';')[0].split('=')[1];
    const userId = loginRes.body.user.id;

    // 4. Access protected route (get own user info)
    const protectedRes = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(protectedRes.status).toBe(200);
    expect(protectedRes.body.user.id).toBe(userId);

    // 5. Refresh token
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);
    expect(refreshRes.status).toBe(200);
    const newCookies = refreshRes.headers['set-cookie'];
    const newAccessToken = newCookies.find((c: string) => c.startsWith('access_token='))?.split(';')[0].split('=')[1];

    // 6. Logout
    const logoutRes = await request(app)
      .delete('/api/auth/logout')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .set('Cookie', newCookies);
    expect(logoutRes.status).toBe(200);

    // 7. Verify can't access (without Authorization header, as cookies are cleared)
    const finalRes = await request(app)
      .get(`/api/users/${userId}`);
    expect(finalRes.status).toBe(401);
  });
});
