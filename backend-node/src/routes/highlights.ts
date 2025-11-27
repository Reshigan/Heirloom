import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

/**
 * GET /api/highlights
 * Get all highlights for the current user
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const highlights = await prisma.highlight.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ highlights });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/highlights
 * Create a new highlight
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { title, description, memoryIds } = req.body;

    if (!title || title.trim().length === 0) {
      throw new AppError(400, 'Title is required');
    }

    if (!memoryIds || !Array.isArray(memoryIds) || memoryIds.length === 0) {
      throw new AppError(400, 'At least one memory ID is required');
    }

    const highlight = await prisma.highlight.create({
      data: {
        userId: req.user!.userId,
        title: title.trim(),
        description: description?.trim() || null,
        memoryIds
      }
    });

    res.status(201).json({ highlight });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/highlights/:id
 * Delete a highlight
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const highlight = await prisma.highlight.findUnique({
      where: { id }
    });

    if (!highlight) {
      throw new AppError(404, 'Highlight not found');
    }

    if (highlight.userId !== req.user!.userId) {
      throw new AppError(403, 'Not authorized to delete this highlight');
    }

    await prisma.highlight.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
