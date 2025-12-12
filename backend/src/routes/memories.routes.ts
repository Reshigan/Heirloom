import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { validate, createMemorySchema, updateMemorySchema, idParamSchema, getUploadUrlSchema } from '../middleware/validation.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { billingService } from '../services/billing.service';
import { storageService } from '../services/storage.service';
import { tinyLLMService } from '../services/tinyllm.service';

const router = Router();
router.use(authenticate);

/**
 * GET /api/memories
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { type, recipientId, page = '1', limit = '20' } = req.query;
  const where: any = { userId: req.user!.id };
  if (type) where.type = type;
  if (recipientId) where.recipients = { some: { familyMemberId: recipientId as string } };

  const [memories, total] = await Promise.all([
    prisma.memory.findMany({
      where,
      include: { recipients: { include: { familyMember: { select: { id: true, name: true, avatarUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    }),
    prisma.memory.count({ where }),
  ]);

  res.json({
    memories: memories.map(m => ({
      id: m.id, type: m.type, title: m.title, description: m.description,
      fileUrl: m.fileUrl, metadata: m.metadata,
      recipients: m.recipients.map(r => r.familyMember), createdAt: m.createdAt,
    })),
    pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, pages: Math.ceil(total / parseInt(limit as string)) },
  });
}));

/**
 * GET /api/memories/stats/summary
 */
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response) => {
  const [totalMemories, byType, totalStorage, recentActivity] = await Promise.all([
    prisma.memory.count({ where: { userId: req.user!.id } }),
    prisma.memory.groupBy({ by: ['type'], where: { userId: req.user!.id }, _count: true }),
    prisma.memory.aggregate({ where: { userId: req.user!.id }, _sum: { fileSize: true } }),
    prisma.memory.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, type: true, title: true, createdAt: true } }),
  ]);

  res.json({
    totalMemories,
    byType: byType.reduce((acc, item) => { acc[item.type] = item._count; return acc; }, {} as Record<string, number>),
    totalStorageMB: Math.round((totalStorage._sum.fileSize || 0) / (1024 * 1024)),
    recentActivity,
  });
}));

/**
 * GET /api/memories/:id
 */
router.get('/:id', validate(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const memory = await prisma.memory.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { recipients: { include: { familyMember: true } } },
  });
  if (!memory) throw ApiError.notFound('Memory not found');

  let signedUrl = null;
  if (memory.fileKey) signedUrl = await storageService.getPresignedDownloadUrl(memory.fileKey);

  res.json({ ...memory, signedUrl, recipients: memory.recipients.map(r => r.familyMember) });
}));

/**
 * POST /api/memories/upload-url
 */
router.post('/upload-url', validate(getUploadUrlSchema), asyncHandler(async (req: Request, res: Response) => {
  const { filename, contentType, folder } = req.body;
  const limit = await billingService.checkLimit(req.user!.id, 'maxStorageMB');
  if (!limit.allowed) throw ApiError.forbidden(`Storage limit of ${limit.max}MB reached. Upgrade your plan.`);

  const result = await storageService.getPresignedUploadUrl(req.user!.id, folder, filename, contentType);
  res.json(result);
}));

/**
 * POST /api/memories
 */
router.post('/', validate(createMemorySchema), asyncHandler(async (req: Request, res: Response) => {
  const { type, title, description, recipientIds, fileKey, fileUrl, fileSize, mimeType, metadata } = req.body;
  const limit = await billingService.checkLimit(req.user!.id, 'maxMemories');
  if (!limit.allowed) throw ApiError.forbidden(`Memory limit of ${limit.max} reached. Upgrade your plan.`);

  let enrichedMetadata = metadata || {};
  const textToAnalyze = `${title || ''} ${description || ''}`.trim();
  if (textToAnalyze) {
    try {
      const emotionResult = await tinyLLMService.classifyEmotion(textToAnalyze);
      enrichedMetadata = { ...enrichedMetadata, emotion: emotionResult.label, emotionConfidence: emotionResult.confidence };
    } catch (error) {
      console.warn('Emotion classification failed for memory:', error);
    }
  }

  const memory = await prisma.memory.create({
    data: {
      userId: req.user!.id, type, title, description, fileKey, fileUrl, fileSize, mimeType, metadata: enrichedMetadata,
      recipients: recipientIds?.length ? { create: recipientIds.map((id: string) => ({ familyMemberId: id })) } : undefined,
    },
    include: { recipients: { include: { familyMember: true } } },
  });

  res.status(201).json({ ...memory, recipients: memory.recipients.map(r => r.familyMember) });
}));

/**
 * PATCH /api/memories/:id
 */
router.patch('/:id', validate(updateMemorySchema), asyncHandler(async (req: Request, res: Response) => {
  const { title, description, recipientIds } = req.body;
  const existing = await prisma.memory.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw ApiError.notFound('Memory not found');

  let emotionUpdate: { emotion?: string; emotionConfidence?: number } = {};
  const textToAnalyze = `${title || existing.title || ''} ${description || existing.description || ''}`.trim();
  if (textToAnalyze && (title || description)) {
    try {
      const emotionResult = await tinyLLMService.classifyEmotion(textToAnalyze);
      emotionUpdate = { emotion: emotionResult.label, emotionConfidence: emotionResult.confidence };
    } catch (error) {
      console.warn('Emotion classification failed for memory update:', error);
    }
  }

  const memory = await prisma.$transaction(async (tx) => {
    const existingMetadata = (existing.metadata as Record<string, unknown>) || {};
    const updatedMetadata = Object.keys(emotionUpdate).length > 0 ? { ...existingMetadata, ...emotionUpdate } : existingMetadata;
    await tx.memory.update({ where: { id: req.params.id }, data: { title, description, metadata: updatedMetadata } });
    if (recipientIds !== undefined) {
      await tx.memoryRecipient.deleteMany({ where: { memoryId: req.params.id } });
      if (recipientIds.length > 0) {
        await tx.memoryRecipient.createMany({ data: recipientIds.map((id: string) => ({ memoryId: req.params.id, familyMemberId: id })) });
      }
    }
    return tx.memory.findUnique({ where: { id: req.params.id }, include: { recipients: { include: { familyMember: true } } } });
  });

  res.json({ ...memory, recipients: memory?.recipients.map(r => r.familyMember) });
}));

/**
 * DELETE /api/memories/:id
 */
router.delete('/:id', validate(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.memory.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw ApiError.notFound('Memory not found');
  if (existing.fileKey) await storageService.deleteFile(existing.fileKey);
  await prisma.memory.delete({ where: { id: req.params.id } });
  res.status(204).send();
}));

export default router;
