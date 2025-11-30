import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/current', async (req: AuthRequest, res, next) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      tier: vault.tier,
      subscription: subscription ? {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd
      } : null
    });
  } catch (error) {
    next(error);
  }
});

export default router;
