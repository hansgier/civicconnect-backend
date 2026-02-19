import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authorizeRoles } from '../../src/middleware/authorize.middleware';
import { UserRole } from '@prisma/client';

const testApp = express();
testApp.use(express.json());

// Mock authentication middleware to attach user
testApp.use((req, _res, next) => {
  const role = req.headers['x-test-role'] as UserRole;
  if (role) {
    req.user = {
      id: 'test-id',
      email: 'test@example.com',
      role: role,
      barangayId: null,
    };
  }
  next();
});

testApp.get('/test-admin', authorizeRoles(UserRole.ADMIN), (_req, res) => {
  res.status(200).json({ message: 'Success' });
});

describe('Authorize Middleware', () => {
  it('should allow authorized roles', async () => {
    const response = await request(testApp)
      .get('/test-admin')
      .set('x-test-role', UserRole.ADMIN);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Success');
  });

  it('should reject unauthorized roles with 403', async () => {
    const response = await request(testApp)
      .get('/test-admin')
      .set('x-test-role', UserRole.CITIZEN);

    expect(response.status).toBe(403);
  });

  it('should reject requests without a user', async () => {
    const response = await request(testApp).get('/test-admin');
    expect(response.status).toBe(403);
  });
});
