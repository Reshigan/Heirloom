import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getTierPolicy } from '../config/tierPolicies';

const router = Router();

router.use(authenticate);

/**
 * Get current usage statistics for the authenticated user
 */
router.get('/current', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;

    const vault = await prisma.vault.findUnique({
      where: { userId },
      include: {
        items: {
          select: {
            id: true,
            createdAt: true,
            fileSizeBytes: true,
          },
        },
      },
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const policy = getTierPolicy(vault.tier);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyMemories = vault.items.filter(
      (item) => item.createdAt >= startOfMonth
    ).length;

    const storageUsedBytes = vault.items.reduce(
      (total, item) => total + Number(item.fileSizeBytes || 0),
      0
    );

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyMemories = vault.items.filter(
      (item) => item.createdAt >= startOfWeek
    ).length;

    const lastMemory = vault.items.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    const daysSinceLastPost = lastMemory
      ? Math.floor((Date.now() - lastMemory.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      tier: vault.tier,
      tierDisplayName: policy.displayName,
      
      monthlyMemories,
      monthlyLimit: policy.monthlyMemoryLimit,
      monthlyPercentage: (monthlyMemories / policy.monthlyMemoryLimit) * 100,
      monthlyRemaining: Math.max(0, policy.monthlyMemoryLimit - monthlyMemories),
      
      weeklyMemories,
      weeklyLimit: policy.weeklyUploadLimit,
      weeklyPercentage: (weeklyMemories / policy.weeklyUploadLimit) * 100,
      weeklyRemaining: Math.max(0, policy.weeklyUploadLimit - weeklyMemories),
      
      storageUsedBytes,
      storageLimitBytes: policy.storageLimitGB * 1024 * 1024 * 1024,
      storageUsedGB: (storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2),
      storageLimitGB: policy.storageLimitGB,
      storagePercentage: (storageUsedBytes / (policy.storageLimitGB * 1024 * 1024 * 1024)) * 100,
      
      totalMemories: vault.items.length,
      lastMemoryDate: lastMemory?.createdAt || null,
      daysSinceLastPost,
      
      approachingMonthlyLimit: monthlyMemories >= policy.monthlyMemoryLimit * policy.usageWarningThreshold,
      monthlyLimitReached: monthlyMemories >= policy.monthlyMemoryLimit,
      approachingWeeklyLimit: weeklyMemories >= policy.weeklyUploadLimit * 0.8,
      weeklyLimitReached: weeklyMemories >= policy.weeklyUploadLimit,
      
      features: policy.features,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get usage history (monthly breakdown)
 */
router.get('/history', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const months = parseInt(req.query.months as string) || 6;

    const vault = await prisma.vault.findUnique({
      where: { userId },
      include: {
        items: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const history = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const count = vault.items.filter(
        (item) => item.createdAt >= monthStart && item.createdAt <= monthEnd
      ).length;

      history.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        count,
      });
    }

    res.json({
      history: history.reverse(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
