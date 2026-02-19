import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, ValidationError } from '../shared/errors/index.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      status: err.status,
      statusCode: err.statusCode,
      message: err.message,
    };

    if (err instanceof ValidationError) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        statusCode: 409,
        message: 'Resource already exists',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Resource not found',
      });
      return;
    }
  }

  logger.error(err);

  const statusCode = 500;
  const message = env.NODE_ENV === 'development' ? err.message : 'Internal server error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
