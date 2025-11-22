import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ValidationUtils } from '../utils/validation';

const router = Router();

router.use(authenticate);

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { method = 'app_notification' } = req.body;

    if (method) {
      ValidationUtils.validateCheckInMethod(method);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + user.checkInIntervalDays);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'alive',
        lastCheckIn: new Date(),
        nextCheckIn,
        gracePeriodEnd: null
      }
    });

    await prisma.checkIn.create({
      data: {
        userId: user.id,
        sentAt: new Date(),
        sentVia: method,
        respondedAt: new Date(),
        responseMethod: method,
        missed: false
      }
    });

    res.json({
      success: true,
      message: 'Check-in recorded successfully',
      nextCheckIn,
      status: 'ALIVE',
      lastCheckIn: new Date()
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        checkIns: {
          orderBy: { sentAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const missedCount = user.checkIns.filter((c: any) => c.missed).length;

    res.json({
      status: user.status.toUpperCase(),
      lastCheckIn: user.lastCheckIn,
      nextCheckIn: user.nextCheckIn,
      intervalDays: user.checkInIntervalDays,
      missedCount,
      recentCheckIns: user.checkIns.map((c: any) => ({
        sentAt: c.sentAt,
        respondedAt: c.respondedAt,
        missed: c.missed
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
