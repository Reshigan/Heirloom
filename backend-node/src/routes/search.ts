import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { aiService } from '../services/AIService';
import { nlpService } from '../services/NLPService';

const router = Router();

router.use(authenticate);

router.get('/search', async (req: AuthRequest, res, next) => {
  try {
    const {
      q,
      type,
      emotionCategory,
      sentimentLabel,
      minImportance,
      maxImportance,
      startDate,
      endDate,
      limit = '50',
      offset = '0'
    } = req.query;

    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const where: any = {
      vaultId: vault.id
    };

    if (type) {
      where.type = type;
    }

    if (emotionCategory) {
      where.emotionCategory = emotionCategory;
    }

    if (sentimentLabel) {
      where.sentimentLabel = sentimentLabel;
    }

    if (minImportance || maxImportance) {
      where.importanceScore = {};
      if (minImportance) where.importanceScore.gte = parseInt(minImportance as string);
      if (maxImportance) where.importanceScore.lte = parseInt(maxImportance as string);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (q) {
      const queryString: string = typeof q === 'string' ? q : (Array.isArray(q) ? String(q[0]) : String(q));
      let searchIntent;
      try {
        searchIntent = await nlpService.parseSearchIntent(queryString);
      } catch (error) {
        console.error('Failed to parse search intent:', error);
        searchIntent = { keywords: [queryString.toLowerCase()] };
      }

      where.OR = [
        { title: { contains: queryString, mode: 'insensitive' } },
        { keywords: { hasSome: searchIntent.keywords } }
      ];

      if (searchIntent.sentiment) {
        where.sentimentLabel = searchIntent.sentiment;
      }
    }

    const [items, total] = await Promise.all([
      prisma.vaultItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        select: {
          id: true,
          type: true,
          title: true,
          thumbnailUrl: true,
          emotionCategory: true,
          importanceScore: true,
          sentimentScore: true,
          sentimentLabel: true,
          keywords: true,
          aiSummary: true,
          createdAt: true
        }
      }),
      prisma.vaultItem.count({ where })
    ]);

    res.json({
      items,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/recommendations', async (req: AuthRequest, res, next) => {
  try {
    const { itemId, limit = '5' } = req.query;

    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    if (itemId) {
      const targetItem = await prisma.vaultItem.findFirst({
        where: {
          id: itemId as string,
          vaultId: vault.id
        }
      });

      if (!targetItem) {
        throw new AppError(404, 'Item not found');
      }

      const allItems = await prisma.vaultItem.findMany({
        where: {
          vaultId: vault.id,
          id: { not: itemId as string }
        },
        select: {
          id: true,
          title: true,
          keywords: true
        }
      });

      const relatedIds = aiService.findRelatedMemories(
        targetItem.title || '',
        targetItem.keywords || [],
        allItems.map(item => ({
          id: item.id,
          text: item.title || '',
          keywords: item.keywords || []
        })),
        parseInt(limit as string)
      );

      const relatedItems = await prisma.vaultItem.findMany({
        where: {
          id: { in: relatedIds }
        },
        select: {
          id: true,
          type: true,
          title: true,
          thumbnailUrl: true,
          emotionCategory: true,
          importanceScore: true,
          aiSummary: true,
          createdAt: true
        }
      });

      res.json({ related: relatedItems });
    } else {
      const importantItems = await prisma.vaultItem.findMany({
        where: {
          vaultId: vault.id,
          importanceScore: { gte: 8 }
        },
        orderBy: [
          { importanceScore: 'desc' },
          { createdAt: 'desc' }
        ],
        take: parseInt(limit as string),
        select: {
          id: true,
          type: true,
          title: true,
          thumbnailUrl: true,
          emotionCategory: true,
          importanceScore: true,
          aiSummary: true,
          createdAt: true
        }
      });

      res.json({ important: importantItems });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/keywords', async (req: AuthRequest, res, next) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const items = await prisma.vaultItem.findMany({
      where: { vaultId: vault.id },
      select: { keywords: true }
    });

    const keywordCounts: Record<string, number> = {};
    items.forEach(item => {
      (item.keywords || []).forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    res.json({ keywords: topKeywords });
  } catch (error) {
    next(error);
  }
});

export default router;
