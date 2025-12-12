import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { validate, createFamilyMemberSchema, updateFamilyMemberSchema, idParamSchema } from '../middleware/validation.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { billingService } from '../services/billing.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/family
 * Get all family members for current user
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const members = await prisma.familyMember.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: {
            memories: true,
            letters: true,
            voiceRecipients: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(
      members.map(m => ({
        id: m.id,
        name: m.name,
        relationship: m.relationship,
        email: m.email,
        phone: m.phone,
        avatarUrl: m.avatarUrl,
        birthDate: m.birthDate,
        notes: m.notes,
        stats: {
          memories: m._count.memories,
          letters: m._count.letters,
          voiceRecordings: m._count.voiceRecipients,
        },
        createdAt: m.createdAt,
      }))
    );
  })
);

/**
 * GET /api/family/:id
 * Get a specific family member
 */
router.get(
  '/:id',
  validate(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const member = await prisma.familyMember.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        memories: {
          include: {
            memory: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        letters: {
          include: {
            letter: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        voiceRecipients: {
          include: {
            voiceRecording: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!member) {
      throw ApiError.notFound('Family member not found');
    }

    res.json({
      id: member.id,
      name: member.name,
      relationship: member.relationship,
      email: member.email,
      phone: member.phone,
      avatarUrl: member.avatarUrl,
      birthDate: member.birthDate,
      notes: member.notes,
      recentMemories: member.memories.map(m => m.memory),
      recentLetters: member.letters.map(l => l.letter),
      recentVoiceRecordings: member.voiceRecipients.map(v => v.voiceRecording),
      createdAt: member.createdAt,
    });
  })
);

/**
 * POST /api/family
 * Create a new family member
 */
router.post(
  '/',
  validate(createFamilyMemberSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Check tier limits
    const limit = await billingService.checkLimit(req.user!.id, 'maxRecipients');
    if (!limit.allowed) {
      throw ApiError.forbidden(
        `You've reached your limit of ${limit.max} family members. Upgrade your plan to add more.`
      );
    }

    const member = await prisma.familyMember.create({
      data: {
        userId: req.user!.id,
        name: req.body.name,
        relationship: req.body.relationship,
        email: req.body.email,
        phone: req.body.phone,
        birthDate: req.body.birthDate ? new Date(req.body.birthDate) : null,
        notes: req.body.notes,
      },
    });

    res.status(201).json(member);
  })
);

/**
 * PATCH /api/family/:id
 * Update a family member
 */
router.patch(
  '/:id',
  validate(updateFamilyMemberSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Verify ownership
    const existing = await prisma.familyMember.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      throw ApiError.notFound('Family member not found');
    }

    const member = await prisma.familyMember.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        relationship: req.body.relationship,
        email: req.body.email,
        phone: req.body.phone,
        birthDate: req.body.birthDate ? new Date(req.body.birthDate) : undefined,
        notes: req.body.notes,
      },
    });

    res.json(member);
  })
);

/**
 * DELETE /api/family/:id
 * Delete a family member
 */
router.delete(
  '/:id',
  validate(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Verify ownership
    const existing = await prisma.familyMember.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      throw ApiError.notFound('Family member not found');
    }

    await prisma.familyMember.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  })
);

export default router;
