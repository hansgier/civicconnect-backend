import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/errors.js';

const GUEST_EMAIL = 'guest@opts.local';

export const rejectGuest = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.email === GUEST_EMAIL) {
    throw new ForbiddenError('Guest users cannot perform this action. Please register or log in.');
  }
  next();
};
