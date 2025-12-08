import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

/**
 * GET /api/settings/profile
 * Get user profile settings
 */
router.get('/profile', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings/profile
 * Update user profile settings
 */
router.put('/profile', async (req: AuthRequest, res, next) => {
  try {
    const { email } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(email !== undefined && { email })
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/settings/security
 * Get security settings
 */
router.get('/security', async (req: AuthRequest, res, next) => {
  try {
    res.status(501).json({
      error: 'Security settings not yet implemented',
      message: 'Two-factor authentication and security features are coming soon'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings/security
 * Update security settings
 */
router.put('/security', async (req: AuthRequest, res, next) => {
  try {
    res.status(501).json({
      error: 'Security settings not yet implemented',
      message: 'Two-factor authentication and security features are coming soon'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/settings/password
 * Change user password
 */
router.post('/password', async (req: AuthRequest, res, next) => {
  try {
    res.status(501).json({
      error: 'Password change not yet implemented',
      message: 'Secure password change functionality is coming soon. Please contact support if you need to change your password.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/settings/privacy
 * Get privacy settings
 */
router.get('/privacy', async (req: AuthRequest, res, next) => {
  try {
    res.status(501).json({
      error: 'Privacy settings not yet implemented',
      message: 'Privacy controls are coming soon'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings/privacy
 * Update privacy settings
 */
router.put('/privacy', async (req: AuthRequest, res, next) => {
  try {
    res.status(501).json({
      error: 'Privacy settings not yet implemented',
      message: 'Privacy controls are coming soon'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/settings/account/deactivate
 * Deactivate user account
 */
router.post('/account/deactivate', async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        status: 'inactive'
      }
    });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/settings/account
 * Delete user account
 */
router.delete('/account', async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user!.userId }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
