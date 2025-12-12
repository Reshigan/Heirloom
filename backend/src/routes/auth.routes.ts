import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { emailService } from '../services/email.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate, registerSchema, loginSchema, refreshSchema } from '../middleware/validation.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    const { user, tokens } = await authService.register({
      email,
      password,
      firstName,
      lastName,
    });

    // Send welcome email
    await emailService.sendWelcome(user.email, user.firstName);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    });
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const { user, tokens } = await authService.login({
      email,
      password,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshTokens(refreshToken);

    res.json(tokens);
  })
);

/**
 * POST /api/auth/logout
 * Logout current session
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.substring(7);

    await authService.logout(req.sessionId!, accessToken);

    res.json({ message: 'Logged out successfully' });
  })
);

/**
 * POST /api/auth/logout-all
 * Logout all sessions
 */
router.post(
  '/logout-all',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!.id);

    res.json({ message: 'All sessions terminated' });
  })
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    });
  })
);

export default router;
