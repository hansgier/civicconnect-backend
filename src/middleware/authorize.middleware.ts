import { Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/errors.js';
import { UserRole } from '../shared/constants/index.js';
import { Request } from 'express';

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const user = req.user;
    if (!roles.includes(user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};
