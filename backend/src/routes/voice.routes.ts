import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { validate, createVoiceRecordingSchema, idParamSchema } from '../middleware/validation.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { billingService } from '../services/billing.service';
import { storageService } from '../services/storage.service';
import { tinyLLMService } from '../services/tinyllm.service';

const router = Router();
router.use(authenticate);

/**
 * GET /api/voice
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { recipientId, page = '1', limit = '20' } = req.query;
  const where: any = { userId: req.user!.id };
  if (recipientId) where.recipients = { some: { familyMemberId: recipientId as string } };

  const [recordings, total] = await Promise.all([
    prisma.voiceRecording.findMany({
      where,
      include: { recipients: { include: { familyMember: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    }),
    prisma.voiceRecording.count({ where }),
  ]);

  res.json({
    recordings: recordings.map(r => ({
      id: r.id, title: r.title, description: r.description, duration: r.duration,
      prompt: r.prompt, waveformData: r.waveformData,
      recipients: r.recipients.map(rec => rec.familyMember), createdAt: r.createdAt,
    })),
    pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, pages: Math.ceil(total / parseInt(limit as string)) },
  });
}));

/**
 * GET /api/voice/stats
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const [totalRecordings, totalDuration] = await Promise.all([
    prisma.voiceRecording.count({ where: { userId: req.user!.id } }),
    prisma.voiceRecording.aggregate({ where: { userId: req.user!.id }, _sum: { duration: true } }),
  ]);

  const limit = await billingService.checkLimit(req.user!.id, 'maxVoiceMinutes');

  res.json({
    totalRecordings,
    totalMinutes: Math.round((totalDuration._sum.duration || 0) / 60),
    usedMinutes: limit.current,
    maxMinutes: limit.max === -1 ? 'unlimited' : limit.max,
  });
}));

/**
 * GET /api/voice/:id
 */
router.get('/:id', validate(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const recording = await prisma.voiceRecording.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { recipients: { include: { familyMember: true } } },
  });
  if (!recording) throw ApiError.notFound('Recording not found');

  const signedUrl = await storageService.getPresignedDownloadUrl(recording.fileKey);

  res.json({ ...recording, signedUrl, recipients: recording.recipients.map(r => r.familyMember) });
}));

/**
 * POST /api/voice/upload-url
 */
router.post('/upload-url', asyncHandler(async (req: Request, res: Response) => {
  const { filename, contentType } = req.body;

  const limit = await billingService.checkLimit(req.user!.id, 'maxVoiceMinutes');
  if (!limit.allowed) throw ApiError.forbidden(`Voice recording limit of ${limit.max} minutes reached. Upgrade your plan.`);

  const result = await storageService.getPresignedUploadUrl(req.user!.id, 'voice', filename, contentType);
  res.json(result);
}));

/**
 * POST /api/voice
 */
router.post('/', validate(createVoiceRecordingSchema), asyncHandler(async (req: Request, res: Response) => {
  const { title, description, duration, prompt, recipientIds, fileKey, fileUrl, fileSize, waveformData, transcript } = req.body;

  const limit = await billingService.checkLimit(req.user!.id, 'maxVoiceMinutes');
  const newMinutes = Math.ceil(duration / 60);
  if (limit.max !== -1 && limit.current + newMinutes > limit.max) {
    throw ApiError.forbidden(`Adding this recording would exceed your ${limit.max} minute limit. Upgrade your plan.`);
  }

  let emotionData: { emotion?: string; emotionConfidence?: number } = {};
  const textToAnalyze = `${title || ''} ${description || ''} ${transcript || ''}`.trim();
  if (textToAnalyze) {
    try {
      const emotionResult = await tinyLLMService.classifyEmotion(textToAnalyze);
      emotionData = { emotion: emotionResult.label, emotionConfidence: emotionResult.confidence };
    } catch (error) {
      console.warn('Emotion classification failed for voice recording:', error);
    }
  }

  const enrichedWaveformData = waveformData ? { ...waveformData, ...emotionData } : emotionData;

  const recording = await prisma.voiceRecording.create({
    data: {
      userId: req.user!.id, title, description, duration, prompt, transcript,
      fileKey, fileUrl, fileSize, waveformData: Object.keys(enrichedWaveformData).length > 0 ? enrichedWaveformData : undefined,
      recipients: recipientIds?.length ? { create: recipientIds.map((id: string) => ({ familyMemberId: id })) } : undefined,
    },
    include: { recipients: { include: { familyMember: true } } },
  });

  res.status(201).json({ ...recording, recipients: recording.recipients.map(r => r.familyMember) });
}));

/**
 * PATCH /api/voice/:id
 */
router.patch('/:id', validate(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const { title, description, recipientIds, transcript } = req.body;
  const existing = await prisma.voiceRecording.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw ApiError.notFound('Recording not found');

  let emotionUpdate: { emotion?: string; emotionConfidence?: number } = {};
  const textToAnalyze = `${title || existing.title || ''} ${description || existing.description || ''} ${transcript || existing.transcript || ''}`.trim();
  if (textToAnalyze && (title || description || transcript)) {
    try {
      const emotionResult = await tinyLLMService.classifyEmotion(textToAnalyze);
      emotionUpdate = { emotion: emotionResult.label, emotionConfidence: emotionResult.confidence };
    } catch (error) {
      console.warn('Emotion classification failed for voice recording update:', error);
    }
  }

  const recording = await prisma.$transaction(async (tx) => {
    const existingWaveformData = (existing.waveformData || {}) as object;
    const updatedWaveformData = Object.keys(emotionUpdate).length > 0 ? { ...existingWaveformData, ...emotionUpdate } : existingWaveformData;
    await tx.voiceRecording.update({ 
      where: { id: req.params.id }, 
      data: { 
        title, 
        description, 
        transcript,
        waveformData: Object.keys(updatedWaveformData).length > 0 ? updatedWaveformData : undefined 
      } 
    });
    if (recipientIds !== undefined) {
      await tx.voiceRecipient.deleteMany({ where: { voiceRecordingId: req.params.id } });
      if (recipientIds.length > 0) {
        await tx.voiceRecipient.createMany({ data: recipientIds.map((id: string) => ({ voiceRecordingId: req.params.id, familyMemberId: id })) });
      }
    }
    return tx.voiceRecording.findUnique({ where: { id: req.params.id }, include: { recipients: { include: { familyMember: true } } } });
  });

  res.json({ ...recording, recipients: recording?.recipients.map((r: { familyMember: unknown }) => r.familyMember) });
}));

/**
 * DELETE /api/voice/:id
 */
router.delete('/:id', validate(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.voiceRecording.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw ApiError.notFound('Recording not found');
  await storageService.deleteFile(existing.fileKey);
  await prisma.voiceRecording.delete({ where: { id: req.params.id } });
  res.status(204).send();
}));

/**
 * GET /api/voice/prompts
 */
router.get('/prompts/list', asyncHandler(async (req: Request, res: Response) => {
  const prompts = await prisma.storyPrompt.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });

  const grouped = prompts.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push({ id: p.id, text: p.text, emoji: p.emoji });
    return acc;
  }, {} as Record<string, Array<{ id: string; text: string; emoji: string | null }>>);

  res.json(grouped);
}));

export default router;
