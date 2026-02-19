import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, changePasswordSchema } from './auth.schema.js';
import { loginRateLimiter, registerRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import passport from '../../config/passport.js';

const router = Router();

router.post('/register', registerRateLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', loginRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/guest', authController.guestLogin);
router.delete('/logout', authenticateUser, authController.logout);
router.get('/me', authenticateUser, authController.getMe);
router.post('/refresh', authController.refresh);
router.post('/verify-email', validate({ body: verifyEmailSchema }), authController.verifyEmail);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);

router.post(
  '/change-password',
  authenticateUser,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/oauth-failure' }),
  authController.oauthCallback
);

// Facebook OAuth
router.get('/facebook',
  passport.authenticate('facebook', { session: false, scope: ['email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/api/auth/oauth-failure' }),
  authController.oauthCallback
);

// OAuth failure handler
router.get('/oauth-failure', authController.oauthFailure);

export default router;
