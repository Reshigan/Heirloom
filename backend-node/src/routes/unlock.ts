import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { UnlockService } from '../services/unlock';

const router = Router();
const unlockService = new UnlockService();

router.post('/verify-death/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const contact = await prisma.trustedContact.findFirst({
      where: { verificationToken: token }
    });

    if (!contact) {
      throw new AppError(404, 'Invalid verification token');
    }

    const result = await unlockService.confirmDeath(contact.id);

    res.json({
      success: true,
      confirmationCount: result.confirmationCount,
      thresholdReached: result.thresholdReached,
      message: result.thresholdReached
        ? 'Threshold reached. Vault will be unlocked after grace period.'
        : `Confirmation recorded (${result.confirmationCount}/2)`
    });
  } catch (error) {
    next(error);
  }
});

router.get('/requests', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const requests = await prisma.unlockRequest.findMany({
      where: { vaultId: vault.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ requests });
  } catch (error) {
    next(error);
  }
});

router.post('/cancel/:requestId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    await unlockService.cancelUnlockRequest(requestId, reason || 'User cancelled');

    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (vault) {
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          status: 'alive',
          lastCheckIn: new Date(),
          nextCheckIn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          gracePeriodEnd: null
        }
      });
    }

    res.json({
      success: true,
      message: 'Unlock request cancelled and status reset to alive'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
