import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticateUser } from '../../src/middleware/auth.middleware';
import { cleanDatabase } from '../helpers/db.helper';
import { createTestUser } from '../helpers/auth.helper';
import { signAccessToken } from '../../src/shared/utils/jwt';
import { UserRole } from '@prisma/client';

const testApp = express();
testApp.use(express.json());
testApp.get('/test-auth', authenticateUser, (req, res) => {
  res.status(200).json({ user: req.user });
});

describe('Auth Middleware', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should reject requests without Authorization header', async () => {
    const response = await request(testApp).get('/test-auth');
    expect(response.status).toBe(401);
  });

  it('should reject requests with expired or invalid token', async () => {
    const response = await request(testApp)
      .get('/test-auth')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
  });

  it('should attach user to request with valid token', async () => {
    const user = await createTestUser();
    const token = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as any, // Cast because of enum differences if any
    });

    const response = await request(testApp)
      .get('/test-auth')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
  });
});
