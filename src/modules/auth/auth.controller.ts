import { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import type { AuthUser } from './auth.types.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setTokenCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE });
  res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE });
};

const clearTokenCookies = (res: Response): void => {
  res.clearCookie('access_token', { ...cookieOptions });
  res.clearCookie('refresh_token', { ...cookieOptions });
};

export const authController = {
  async register(req: Request, res: Response) {
    await authService.register(req.body as RegisterInput);
    res.status(201).json({ message: 'Registration successful. Please verify your email.' });
  },

  async login(req: Request, res: Response) {
    const result = (await authService.login(req.body as LoginInput)) as AuthResponse;
    setTokenCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ user: result.user });
  },

  async getMe(req: Request, res: Response) {
    const authUser = req.user;

    if (!authUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        barangayId: true,
        emailVerified: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  },

  async logout(req: Request, res: Response) {
    const user = req.user;
    const userId = user?.id;
    if (userId) {
      await authService.logout(userId);
    }
    clearTokenCookies(res);
    res.status(200).json({ message: 'Logged out successfully' });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token provided' });
      return;
    }

    const tokens = await authService.refreshToken(refreshToken);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(200).json({ message: 'Token refreshed' });
  },

  async verifyEmail(req: Request, res: Response) {
    await authService.verifyEmail(req.body.token);
    res.status(200).json({ message: 'Email verified successfully' });
  },

  async forgotPassword(req: Request, res: Response) {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
  },

  async guestLogin(_req: Request, res: Response) {
    const result = (await authService.guestLogin()) as AuthResponse;
    setTokenCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ user: result.user });
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json({ message: 'Password reset successful' });
  },

  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.status(200).json({ message: 'Password changed successfully' });
  },

  async oauthCallback(req: Request, res: Response) {
    const user = req.user;
    if (!user) {
      return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }

    // Issue JWT tokens
    const { accessToken, refreshToken } = await authService.issueTokens(user);

    // Set cookies
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // Redirect to frontend
    res.redirect(env.CLIENT_URL);
  },

  async oauthFailure(_req: Request, res: Response) {
    res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
  },
};
