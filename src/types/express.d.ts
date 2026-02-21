import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
      barangayId: string | null;
      name: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
