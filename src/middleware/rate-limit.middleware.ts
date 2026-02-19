import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { RATE_LIMITS } from '../shared/constants/index.js';

const loginLimiter = new RateLimiterMemory(RATE_LIMITS.LOGIN);
const registerLimiter = new RateLimiterMemory(RATE_LIMITS.REGISTER);
const apiLimiter = new RateLimiterMemory(RATE_LIMITS.API);

export const loginRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  try {
    await loginLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rateLimiterRes: unknown) {
    const resObj = rateLimiterRes as RateLimiterRes;
    const retryAfter = Math.ceil(resObj.msBeforeNext / 1000) || 60;
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many login attempts. Please try again in 1 minute.',
    });
  }
};

export const registerRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  try {
    await registerLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rateLimiterRes: unknown) {
    const resObj = rateLimiterRes as RateLimiterRes;
    const retryAfter = Math.ceil(resObj.msBeforeNext / 1000) || 60;
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many registration attempts. Please try again in 1 minute.',
    });
  }
};

export const apiRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  try {
    await apiLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rateLimiterRes: unknown) {
    const resObj = rateLimiterRes as RateLimiterRes;
    const retryAfter = Math.ceil(resObj.msBeforeNext / 1000) || 60;
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    });
  }
};
