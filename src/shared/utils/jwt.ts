import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/errors.js';
import { UserRole } from '../constants/index.js';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  barangayId: string | null;
}

export const signAccessToken = (payload: Omit<JwtPayload, 'barangayId'>): string => {
  const options: SignOptions = {
    expiresIn: '15m',
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const signRefreshToken = (payload: Omit<JwtPayload, 'barangayId'>): string => {
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};
