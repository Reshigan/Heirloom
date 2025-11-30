import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { CryptoUtils } from '../utils/crypto';

const router = Router();

router.use(authenticate);

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { email, phone, name, shamirShareEncrypted } = req.body;

    if (!email) {
      throw new AppError(400, 'Email is required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { trustedContacts: true }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.trustedContacts.length >= 5) {
      throw new AppError(403, 'Maximum 5 trusted contacts allowed');
    }

    const verificationToken = CryptoUtils.generateToken();

    const contact = await prisma.trustedContact.create({
      data: {
        userId: user.id,
        email,
        phone,
        name,
        shamirShareEncrypted,
        verificationToken
      }
    });

    res.status(201).json({
      contact: {
        id: contact.id,
        email: contact.email,
        name: contact.name,
        verificationStatus: contact.verificationStatus,
        createdAt: contact.createdAt
      },
      verificationSent: true
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const contacts = await prisma.trustedContact.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      contacts: contacts.map((c: any) => ({
        id: c.id,
        email: c.email,
        name: c.name,
        verificationStatus: c.verificationStatus,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.post('/trusted-contacts/:id/share', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const contactId = req.params.id;
    const { shareCiphertext, algorithm, shareIndex } = req.body;

    if (!shareCiphertext || !algorithm || shareIndex === undefined) {
      throw new AppError(400, 'Missing required fields: shareCiphertext, algorithm, shareIndex');
    }

    const contact = await prisma.trustedContact.findFirst({
      where: {
        id: contactId,
        userId
      }
    });

    if (!contact) {
      throw new AppError(404, 'Trusted contact not found');
    }

    const vault = await prisma.vault.findUnique({
      where: { userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const keyShare = await prisma.keyShare.upsert({
      where: {
        vaultId_trustedContactId: {
          vaultId: vault.id,
          trustedContactId: contactId
        }
      },
      update: {
        shareCiphertext,
        algorithm,
        shareIndex
      },
      create: {
        vaultId: vault.id,
        trustedContactId: contactId,
        shareCiphertext,
        algorithm,
        shareIndex
      }
    });

    res.json({
      success: true,
      keyShare: {
        id: keyShare.id,
        algorithm: keyShare.algorithm,
        shareIndex: keyShare.shareIndex,
        createdAt: keyShare.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/trusted-contacts/my-shares', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;

    const contacts = await prisma.trustedContact.findMany({
      where: { email: req.user!.email },
      include: {
        keyShares: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    const shares = contacts.map(contact => ({
      vaultOwnerId: contact.userId,
      vaultOwnerEmail: contact.user.email,
      contactId: contact.id,
      shareCiphertext: contact.keyShares[0]?.shareCiphertext,
      algorithm: contact.keyShares[0]?.algorithm,
      shareIndex: contact.keyShares[0]?.shareIndex,
      createdAt: contact.keyShares[0]?.createdAt
    }));

    res.json({
      shares: shares.filter(s => s.shareCiphertext)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
