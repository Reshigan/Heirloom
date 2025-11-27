import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

/**
 * GET /api/time-capsules
 * Get all time capsules for the current user
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const timeCapsules = await prisma.timeCapsule.findMany({
      where: { userId: req.user!.userId },
      orderBy: { unlockDate: 'asc' }
    });

    res.json({ timeCapsules });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/time-capsules
 * Create a new time capsule
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { title, message, memoryIds, unlockDate, recipients } = req.body;

    if (!title || title.trim().length === 0) {
      throw new AppError(400, 'Title is required');
    }

    if (!message || message.trim().length === 0) {
      throw new AppError(400, 'Message is required');
    }

    if (!memoryIds || !Array.isArray(memoryIds) || memoryIds.length === 0) {
      throw new AppError(400, 'At least one memory ID is required');
    }

    if (!unlockDate) {
      throw new AppError(400, 'Unlock date is required');
    }

    const unlockDateTime = new Date(unlockDate);
    if (unlockDateTime <= new Date()) {
      throw new AppError(400, 'Unlock date must be in the future');
    }

    const timeCapsule = await prisma.timeCapsule.create({
      data: {
        userId: req.user!.userId,
        title: title.trim(),
        message: message.trim(),
        memoryIds,
        unlockDate: unlockDateTime,
        recipients: recipients || []
      }
    });

    res.status(201).json({ timeCapsule });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/time-capsules/:id/unlock
 * Unlock a time capsule (if unlock date has passed)
 */
router.post('/:id/unlock', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const timeCapsule = await prisma.timeCapsule.findUnique({
      where: { id }
    });

    if (!timeCapsule) {
      throw new AppError(404, 'Time capsule not found');
    }

    if (timeCapsule.userId !== req.user!.userId) {
      throw new AppError(403, 'Not authorized to unlock this time capsule');
    }

    if (timeCapsule.unlockDate > new Date()) {
      throw new AppError(400, 'Time capsule cannot be unlocked yet');
    }

    if (!timeCapsule.isLocked) {
      throw new AppError(400, 'Time capsule is already unlocked');
    }

    const updated = await prisma.timeCapsule.update({
      where: { id },
      data: { isLocked: false }
    });

    res.json({ 
      message: 'Time capsule unlocked successfully',
      timeCapsule: updated
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/time-capsules/:id
 * Delete a time capsule
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const timeCapsule = await prisma.timeCapsule.findUnique({
      where: { id }
    });

    if (!timeCapsule) {
      throw new AppError(404, 'Time capsule not found');
    }

    if (timeCapsule.userId !== req.user!.userId) {
      throw new AppError(403, 'Not authorized to delete this time capsule');
    }

    await prisma.timeCapsule.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
