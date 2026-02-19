import { UserRole } from '../constants/index.js';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
      barangayId: string | null;
    }

    interface Request {
      user?: User;
    }
  }
}
