import { UserRole } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { hashPassword, comparePassword } from '../../shared/utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt.js';
import { addEmailJob } from '../../jobs/queues/email.queue.js';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../shared/errors/errors.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import type { AuthUser } from './auth.types.js';

const VERIFICATION_TOKEN_EXP = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_EXP = 15 * 60 * 1000;

interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
  barangayId: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const excludePassword = (user: UserWithoutPassword): AuthUser => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AuthUser['role'],
    status: user.status,
    barangayId: user.barangayId,
    emailVerified: user.emailVerified,
  };
};

export const authService = {
  async issueTokens(user: { id: string; email: string; role: string; barangayId?: string | null }) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      barangayId: user.barangayId ?? undefined,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token in DB
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return { accessToken, refreshToken };
  },

  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await hashPassword(data.password);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'CITIZEN',
        status: 'PENDING',
        emailVerified: false,
        verificationToken: hashedVerificationToken,
        verificationTokenExp: new Date(Date.now() + VERIFICATION_TOKEN_EXP),
        barangayId: data.barangayId ?? null,
      },
    });

    await addEmailJob('verification-email', { to: data.email, token: verificationToken });

    return excludePassword(user as UserWithoutPassword);
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // OAuth-only users cannot log in with password
    if (!user.password) {
      throw new BadRequestError(
        'This account uses social login. Please sign in with Google or Facebook.'
      );
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError('Please verify your email before logging in');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Your account has been suspended');
    }

    const { accessToken, refreshToken } = await this.issueTokens(user);

    return {
      user: excludePassword(user as UserWithoutPassword),
      accessToken,
      refreshToken,
    };
  },

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  },

  async refreshToken(token: string) {
    const payload = verifyRefreshToken(token as string);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    if (user.refreshToken !== hashedToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      throw new UnauthorizedError('Token reuse detected. Please login again');
    }

    const { accessToken, refreshToken } = await this.issueTokens(user);

    return {
      accessToken,
      refreshToken,
    };
  },

  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: hashedToken,
        verificationTokenExp: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: 'ACTIVE',
        verificationToken: null,
        verificationTokenExp: null,
      },
    });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedResetToken,
          passwordResetTokenExp: new Date(Date.now() + PASSWORD_RESET_TOKEN_EXP),
        },
      });

      await addEmailJob('password-reset-email', { to: email, token: resetToken });
    }
  },

  async guestLogin() {
    const GUEST_EMAIL = 'guest@opts.local';
    const GUEST_NAME = 'Guest User';

    let user = await prisma.user.findUnique({
      where: { email: GUEST_EMAIL },
    });

    if (!user) {
      // Create the guest user with a random password (never used directly)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          name: GUEST_NAME,
          email: GUEST_EMAIL,
          password: hashedPassword,
          role: 'CITIZEN',
          status: 'ACTIVE',
          emailVerified: true,
        },
      });
    }

    const { accessToken, refreshToken } = await this.issueTokens(user);

    return {
      user: excludePassword(user as UserWithoutPassword),
      accessToken,
      refreshToken,
    };
  },

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetTokenExp: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExp: null,
        refreshToken: null,
      },
    });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedError('User not found or uses social login');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        refreshToken: null,
      },
    });
  },
};
