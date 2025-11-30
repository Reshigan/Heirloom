import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { aiService } from '../services/AIService';

const router = Router();

router.use(authenticate);

/**
 * GET /api/curator/suggestions
 * Get AI-curated suggestions based on vault items
 */
router.get('/suggestions', async (req: AuthRequest, res, next) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      return res.json({ suggestions: [] });
    }

    const items = await prisma.vaultItem.findMany({
      where: { vaultId: vault.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (items.length === 0) {
      return res.json({ suggestions: [] });
    }

    const suggestions = [];

    const untitledCount = items.filter(item => !item.title).length;
    if (untitledCount > 0) {
      suggestions.push({
        id: 'add-titles',
        type: 'action',
        title: 'Add Titles to Your Memories',
        description: `You have ${untitledCount} items without titles. Adding titles makes them easier to find and share.`,
        priority: 'medium',
        actionUrl: '/vault'
      });
    }

    const emotions = items.map(item => item.emotionCategory).filter(Boolean);
    const uniqueEmotions = new Set(emotions);
    if (uniqueEmotions.size < 3 && items.length > 5) {
      suggestions.push({
        id: 'emotion-diversity',
        type: 'insight',
        title: 'Capture More Emotional Moments',
        description: 'Your vault captures a limited range of emotions. Consider adding memories that reflect different feelings and experiences.',
        priority: 'low'
      });
    }

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentItems = items.filter(item => item.createdAt >= lastWeek);
    if (recentItems.length === 0 && items.length > 0) {
      suggestions.push({
        id: 'stay-active',
        type: 'reminder',
        title: 'Keep Your Vault Active',
        description: "It's been a while since your last upload. Regular updates help preserve your legacy.",
        priority: 'medium',
        actionUrl: '/vault/upload'
      });
    }

    const posthumousCount = items.filter(item => item.visibility === 'POSTHUMOUS').length;
    if (posthumousCount === 0 && items.length > 3) {
      suggestions.push({
        id: 'posthumous-items',
        type: 'insight',
        title: 'Consider Posthumous Messages',
        description: 'You haven\'t created any posthumous items yet. These are messages that will be shared with loved ones after you\'re gone.',
        priority: 'high',
        actionUrl: '/vault/upload'
      });
    }

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
});

export default router;
