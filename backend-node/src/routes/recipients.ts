import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { email, name, relationship, accessLevel } = req.body;

    if (!email) {
      throw new AppError(400, 'Email is required');
    }

    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId },
      include: { recipients: true }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const limits: Record<string, number> = {
      STARTER: 10,
      FAMILY: 50,
      UNLIMITED: 999999,
      LIFETIME: 999999
    };

    if (vault.recipients.length >= limits[vault.tier]) {
      throw new AppError(403, `Recipient limit reached for ${vault.tier} tier`);
    }

    const recipient = await prisma.recipient.create({
      data: {
        vaultId: vault.id,
        email,
        name,
        relationship,
        accessLevel: accessLevel || 'SPECIFIC'
      }
    });

    res.status(201).json({
      recipient: {
        id: recipient.id,
        email: recipient.email,
        name: recipient.name,
        relationship: recipient.relationship,
        accessLevel: recipient.accessLevel,
        createdAt: recipient.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId },
      include: {
        recipients: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    res.json({
      recipients: vault.recipients.map((r: any) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        relationship: r.relationship,
        accessLevel: r.accessLevel,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
