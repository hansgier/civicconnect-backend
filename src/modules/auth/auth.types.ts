import { UserRole } from '../../shared/constants/index.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  barangayId: string | null;
  status: string;
  emailVerified: boolean;
}
