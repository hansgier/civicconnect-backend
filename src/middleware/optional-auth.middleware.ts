import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../shared/utils/jwt.js';
import { prisma } from '../config/database.js';

/**
 * Optional authentication middleware.
 * If a valid token is present, attaches req.user.
 * If no token or invalid token, continues without req.user (no error).
 * Use this on read-only public endpoints.
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.access_token;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;

    if (!token) return next();

    const payload = verifyAccessToken(token);
    if (!payload) return next();

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, barangayId: true, status: true, name: true },
    });

    if (user && user.status === 'ACTIVE') {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        barangayId: user.barangayId,
        name: user.name,
      };
    }
  } catch {
    // Token invalid/expired — continue as guest (no error)
  }

  next();
};
