import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/current', async (req: AuthRequest, res, next) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId },
      include: { subscription: true }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    res.json({
      tier: vault.tier,
      subscription: vault.subscription ? {
        status: vault.subscription.status,
        currentPeriodEnd: vault.subscription.currentPeriodEnd
      } : null
    });
  } catch (error) {
    next(error);
  }
});

export default router;
