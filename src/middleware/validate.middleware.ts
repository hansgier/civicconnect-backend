import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../shared/errors/errors.js';

interface ValidateOptions {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export const validate = (options: ValidateOptions) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    if (options.body) {
      try {
        options.body.parse(_req.body);
      } catch (err) {
        if (err instanceof ZodError) {
          err.issues.forEach(e => {
            const path = e.path.join('.');
            errors.push({ field: path || 'body', message: e.message });
          });
        }
      }
    }

    if (options.params) {
      try {
        options.params.parse(_req.params);
      } catch (err) {
        if (err instanceof ZodError) {
          err.issues.forEach(e => {
            const path = e.path.join('.');
            errors.push({ field: path || 'params', message: e.message });
          });
        }
      }
    }

    if (options.query) {
      try {
        options.query.parse(_req.query);
      } catch (err) {
        if (err instanceof ZodError) {
          err.issues.forEach(e => {
            const path = e.path.join('.');
            errors.push({ field: path || 'query', message: e.message });
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  };
};
