import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { cleanDatabase } from '../helpers/db.helper';
import { createTestUser, loginTestUser } from '../helpers/auth.helper';
import { prisma } from '../../src/config/database';
import crypto from 'crypto';

describe('Auth Module', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Registration', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('successful');
      
      const user = await prisma.user.findUnique({ where: { email: 'new@example.com' } });
      expect(user).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      await createTestUser({ email: 'duplicate@example.com' });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(409);
    });

    it('should return 422 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'password123',
        });

      expect(response.status).toBe(422);
    });

    it('should return 422 for password shorter than 8 chars', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pwd',
          email: 'short@example.com',
          password: '123',
        });

      expect(response.status).toBe(422);
    });
  });

  describe('Login', () => {
    it('should login with correct credentials and return tokens', async () => {
      const email = 'login@example.com';
      await createTestUser({ email, password: 'password123', emailVerified: true });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const email = 'wrongpass@example.com';
      await createTestUser({ email, password: 'password123' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for unverified email', async () => {
      const email = 'unverified@example.com';
      await createTestUser({ email, emailVerified: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'password123' });

      expect(response.status).toBe(401);
    });

    it('should set httpOnly cookies for tokens', async () => {
      const email = 'cookies@example.com';
      await createTestUser({ email, emailVerified: true });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'password123' });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('access_token'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('refresh_token'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });
  });

  describe('Logout', () => {
    it('should clear tokens and cookies', async () => {
      const email = 'logout@example.com';
      await createTestUser({ email, emailVerified: true });
      const loginRes = await loginTestUser(app, email);

      const response = await request(app)
        .delete('/api/auth/logout')
        .set('Authorization', `Bearer ${loginRes.accessToken}`)
        .set('Cookie', loginRes.cookies);

      expect(response.status).toBe(200);
      const cookies = response.headers['set-cookie'];
      expect(cookies.some((c: string) => c.includes('access_token=;'))).toBe(true);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).delete('/api/auth/logout');
      expect(response.status).toBe(401);
    });
  });

  describe('Token Refresh', () => {
    it('should issue new tokens with valid refresh token', async () => {
      const email = 'refresh@example.com';
      await createTestUser({ email });
      const loginRes = await loginTestUser(app, email);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', loginRes.cookies);

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for expired or invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      const rawToken = 'valid-token';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await createTestUser({ 
        email: 'verify@example.com', 
        verificationToken: hashedToken,
        verificationTokenExp: new Date(Date.now() + 3600000)
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: rawToken });

      expect(response.status).toBe(200);
      
      const user = await prisma.user.findUnique({ where: { email: 'verify@example.com' } });
      expect(user?.emailVerified).toBe(true);
    });

    it('should return 400 for invalid/expired token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(400);
    });
  });

  describe('Password Reset', () => {
    it('should send reset email for existing user', async () => {
      const email = 'reset@example.com';
      await createTestUser({ email });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email });

      expect(response.status).toBe(200);
    });

    it('should return 200 even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
    });

    it('should reset password with valid token', async () => {
      const rawToken = 'reset-token';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await createTestUser({ 
        email: 'doreset@example.com', 
        passwordResetToken: hashedToken,
        passwordResetTokenExp: new Date(Date.now() + 3600000)
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: rawToken, password: 'newpassword123' });

      expect(response.status).toBe(200);
    });

    it('should return 400 for expired reset token', async () => {
      const token = 'expired-token';
      await createTestUser({ 
        email: 'expiredreset@example.com', 
        passwordResetToken: token,
        passwordResetTokenExp: new Date(Date.now() - 3600000)
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'newpassword123' });

      expect(response.status).toBe(400);
    });
  });
});
