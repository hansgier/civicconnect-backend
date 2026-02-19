import request from 'supertest';
import { prisma } from '../../src/config/database';
import { hashPassword } from '../../src/shared/utils/hash';
import { UserRole, UserStatus } from '@prisma/client';

export const createTestUser = async (overrides: any = {}) => {
  const password = overrides.password || 'password123';
  const hashedPassword = await hashPassword(password);

  return prisma.user.create({
    data: {
      name: 'Test User',
      email: `test-${Math.random()}@example.com`,
      password: hashedPassword,
      role: UserRole.CITIZEN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      ...overrides,
    },
  });
};

export const loginTestUser = async (app: any, email: string, password: string = 'password123') => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return {
    user: response.body.user,
    accessToken: response.headers['set-cookie']?.find((c: string) => c.startsWith('access_token='))?.split(';')[0].split('=')[1],
    refreshToken: response.headers['set-cookie']?.find((c: string) => c.startsWith('refresh_token='))?.split(';')[0].split('=')[1],
    cookies: response.headers['set-cookie'],
    status: response.status,
    body: response.body,
  };
};

export const getAuthHeaders = async (app: any, role: UserRole = UserRole.CITIZEN) => {
  const user = await createTestUser({ role });
  const loginData = await loginTestUser(app, user.email);

  return {
    Authorization: `Bearer ${loginData.accessToken}`,
    user,
    accessToken: loginData.accessToken,
    refreshToken: loginData.refreshToken,
    cookies: loginData.cookies,
  };
};
