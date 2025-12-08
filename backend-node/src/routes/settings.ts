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
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      twoFactorEnabled: false,
      lastPasswordChange: null
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
    const { twoFactorEnabled } = req.body;

    res.json({
      twoFactorEnabled: twoFactorEnabled || false,
      lastPasswordChange: null
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
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(400, 'Current password and new password are required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ message: 'Password updated successfully' });
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
    res.json({
      dataRetentionDays: 365,
      allowDataSharing: false,
      allowAnalytics: true
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
    const { dataRetentionDays, allowDataSharing, allowAnalytics } = req.body;

    res.json({
      dataRetentionDays: dataRetentionDays || 365,
      allowDataSharing: allowDataSharing || false,
      allowAnalytics: allowAnalytics !== undefined ? allowAnalytics : true
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
