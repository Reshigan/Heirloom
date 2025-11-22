import { Router } from 'express';
import { prisma } from '../index';
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

export default router;
