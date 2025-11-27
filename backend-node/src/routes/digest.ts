import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * GET /api/digest/weekly
 * Get weekly digest of vault activity
 */
router.get('/weekly', async (req: AuthRequest, res, next) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      return res.json({
        items: [],
        stats: {
          totalItems: 0,
          uploadsThisWeek: 0,
          storageUsed: '0'
        },
        period: 'This Week'
      });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentItems = await prisma.vaultItem.findMany({
      where: {
        vaultId: vault.id,
        createdAt: {
          gte: oneWeekAgo
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const totalItems = await prisma.vaultItem.count({
      where: { vaultId: vault.id }
    });

    const digestItems = recentItems.map(item => ({
      id: item.id,
      type: 'upload',
      title: item.title || `New ${item.type}`,
      description: `Uploaded a ${item.type}`,
      timestamp: item.createdAt.toISOString(),
      icon: getIconForType(item.type),
      color: getColorForEmotion(item.emotionCategory)
    }));

    res.json({
      items: digestItems,
      stats: {
        totalItems,
        uploadsThisWeek: vault.uploadCountThisWeek,
        storageUsed: vault.storageUsedBytes.toString()
      },
      period: 'This Week'
    });
  } catch (error) {
    next(error);
  }
});

function getIconForType(type: string): string {
  const icons: Record<string, string> = {
    photo: '📷',
    video: '🎥',
    letter: '✉️',
    voice: '🎤',
    document: '📄',
    wisdom: '💡'
  };
  return icons[type] || '📦';
}

function getColorForEmotion(emotion: string | null): string {
  if (!emotion) return 'blue';
  
  const colors: Record<string, string> = {
    happy: 'yellow',
    sad: 'blue',
    joyful: 'gold',
    nostalgic: 'purple',
    neutral: 'gray'
  };
  return colors[emotion] || 'blue';
}

export default router;
