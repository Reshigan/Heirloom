import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { validate, createLetterSchema, updateLetterSchema, idParamSchema } from '../middleware/validation.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { billingService } from '../services/billing.service';
import { emailService } from '../services/email.service';

const router = Router();
router.use(authenticate);

/**
 * GET /api/letters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { deliveryTrigger, recipientId, page = '1', limit = '20' } = req.query;
  const where: any = { userId: req.user!.id };
  if (deliveryTrigger) where.deliveryTrigger = deliveryTrigger;
  if (recipientId) where.recipients = { some: { familyMemberId: recipientId as string } };

  const [letters, total] = await Promise.all([
    prisma.letter.findMany({
      where,
      include: { recipients: { include: { familyMember: { select: { id: true, name: true } } } }, _count: { select: { deliveries: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    }),
    prisma.letter.count({ where }),
  ]);

  res.json({
    letters: letters.map(l => ({
      id: l.id, title: l.title, salutation: l.salutation, bodyPreview: l.body.substring(0, 100) + '...',
      signature: l.signature, deliveryTrigger: l.deliveryTrigger, scheduledDate: l.scheduledDate, sealedAt: l.sealedAt,
      recipients: l.recipients.map(r => r.familyMember), deliveryCount: l._count.deliveries, createdAt: l.createdAt,
    })),
    pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, pages: Math.ceil(total / parseInt(limit as string)) },
  });
}));

/**
 * GET /api/letters/:id
 */
router.get('/:id', validate(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const letter = await prisma.letter.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { recipients: { include: { familyMember: true } }, deliveries: { orderBy: { createdAt: 'desc' } } },
  });
  if (!letter) throw ApiError.notFound('Letter not found');
  res.json({ ...letter, recipients: letter.recipients.map(r => r.familyMember) });
}));

/**
 * POST /api/letters
 */
router.post('/', validate(createLetterSchema), asyncHandler(async (req: Request, res: Response) => {
  const { title, salutation, body, signature, deliveryTrigger, scheduledDate, recipientIds } = req.body;

  const limit = await billingService.checkLimit(req.user!.id, 'maxLetters');
  if (!limit.allowed) throw ApiError.forbidden(`Letter limit of ${limit.max} reached. Upgrade your plan.`);

  const letter = await prisma.letter.create({
    data: {
      userId: req.user!.id, title, salutation, body, signature, deliveryTrigger,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      recipients: { create: recipientIds.map((id: string) => ({ familyMemberId: id })) },
    },
    include: { recipients: { include: { familyMember: true } } },
  });

  res.status(201).json({ ...letter, recipients: letter.recipients.map(r => r.familyMember) });
}));

/**
 * PATCH /api/letters/:id
 */
router.patch('/:id', validate(updateLetterSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.letter.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw ApiError.notFound('Letter not found');
  if (existing.sealedAt) throw ApiError.forbidden('Cannot edit a sealed letter');

  const { title, salutation, body, signature, deliveryTrigger, scheduledDate, recipientIds } = req.body;

  const letter = await prisma.$transaction(async (tx) => {
    await tx.letter.update({
      where: { id: req.params.id },
      data: { title, salutation, body, signature, deliveryTrigger, scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined },
    });
    if (recipientIds !== undefined) {
      await tx.letterRecipient.deleteMany({ where: { letterId: req.params.id } });
      if (recipientIds.length > 0) {
        await tx.letterRecipient.createMany({ data: recipientIds.map((id: string) => ({ letterId: req.params.id, familyMemberId: id })) });
      }
    }
    return tx.letter.findUnique({ where: { id: req.params.id }, include: { recipients: { include: { familyMember: true } } } });
  });

  res.json({ ...letter, recipients: letter?.recipients.map(r => r.familyMember) });
}));

/**
 * POST /api/letters/:id/seal
 */
router.post('/:id/seal', validate(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.letter.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { recipients: { include: { familyMember: true } } },
  });
  if (!existing) throw ApiError.notFound('Letter not found');
  if (existing.sealedAt) throw ApiError.conflict('Letter is already sealed');

  const letter = await prisma.letter.update({
    where: { id: req.params.id },
    data: { sealedAt: new Date() },
    include: { recipients: { include: { familyMember: true } } },
  });

  // If immediate delivery, send now
  if (letter.deliveryTrigger === 'IMMEDIATE') {
    const user = req.user!;
    for (const recipient of letter.recipients) {
      if (recipient.familyMember.email) {
        const sent = await emailService.sendLetterDelivery(
          recipient.familyMember.email,
          recipient.familyMember.name,
          `${user.firstName} ${user.lastName}`,
          { salutation: letter.salutation || '', body: letter.body, signature: letter.signature || '' }
        );

        await prisma.letterDelivery.create({
          data: {
            letterId: letter.id,
            recipientEmail: recipient.familyMember.email,
            status: sent ? 'DELIVERED' : 'FAILED',
            sentAt: sent ? new Date() : null,
            deliveredAt: sent ? new Date() : null,
            failedAt: sent ? null : new Date(),
            failureReason: sent ? null : 'Email delivery failed',
          },
        });
      }
    }
  }

  res.json({ ...letter, recipients: letter.recipients.map(r => r.familyMember) });
}));

/**
 * DELETE /api/letters/:id
 */
router.delete('/:id', validate(idParamSchema), asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.letter.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw ApiError.notFound('Letter not found');
  await prisma.letter.delete({ where: { id: req.params.id } });
  res.status(204).send();
}));

export default router;
