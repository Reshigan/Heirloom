import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

/**
 * GET /api/vault/items/:itemId/comments
 * Get all comments for a vault item
 */
router.get('/vault/items/:itemId/comments', async (req: AuthRequest, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await prisma.vaultItem.findFirst({
      where: {
        id: itemId,
        vault: { userId: req.user!.userId }
      }
    });

    if (!item) {
      throw new AppError(404, 'Vault item not found');
    }

    const comments = await prisma.comment.findMany({
      where: { itemId },
      include: {
        reactions: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ comments });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vault/items/:itemId/comments
 * Add a comment to a vault item
 */
router.post('/vault/items/:itemId/comments', async (req: AuthRequest, res, next) => {
  try {
    const { itemId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      throw new AppError(400, 'Comment content is required');
    }

    const item = await prisma.vaultItem.findFirst({
      where: {
        id: itemId,
        vault: { userId: req.user!.userId }
      }
    });

    if (!item) {
      throw new AppError(404, 'Vault item not found');
    }

    const comment = await prisma.comment.create({
      data: {
        itemId,
        userId: req.user!.userId,
        content: content.trim()
      },
      include: {
        reactions: true
      }
    });

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/comments/:commentId
 * Delete a comment
 */
router.delete('/comments/:commentId', async (req: AuthRequest, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError(404, 'Comment not found');
    }

    if (comment.userId !== req.user!.userId) {
      throw new AppError(403, 'Not authorized to delete this comment');
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/comments/:commentId/reactions
 * Add a reaction to a comment
 */
router.post('/comments/:commentId/reactions', async (req: AuthRequest, res, next) => {
  try {
    const { commentId } = req.params;
    const { type } = req.body;

    if (!type) {
      throw new AppError(400, 'Reaction type is required');
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError(404, 'Comment not found');
    }

    const reaction = await prisma.commentReaction.upsert({
      where: {
        commentId_userId_type: {
          commentId,
          userId: req.user!.userId,
          type
        }
      },
      create: {
        commentId,
        userId: req.user!.userId,
        type
      },
      update: {}
    });

    res.json({ reaction });
  } catch (error) {
    next(error);
  }
});

export default router;
