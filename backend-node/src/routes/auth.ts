import { Router } from 'express';
import { prisma } from '../index';
import { CryptoUtils } from '../utils/crypto';
import { JWTUtils } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ValidationUtils } from '../utils/validation';

const router = Router();

/**
 * POST /api/auth/register
 * Register new user and create vault
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    ValidationUtils.validateEmail(email);

    ValidationUtils.validatePassword(password);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    const { hash, salt } = await CryptoUtils.hashPassword(password);

    const vmkSalt = CryptoUtils.generateSalt();

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hash,
          salt,
          nextCheckIn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        }
      });

      const uploadLimit = process.env.UPLOAD_LIMIT_WEEKLY 
        ? parseInt(process.env.UPLOAD_LIMIT_WEEKLY, 10) 
        : 100;

      const vault = await tx.vault.create({
        data: {
          userId: user.id,
          encryptedVmk: '', // Will be set by client after encryption
          tier: 'STARTER',
          uploadLimitWeekly: uploadLimit
        }
      });

      return { user, vault };
    });

    const token = JWTUtils.sign({
      userId: result.user.id,
      email: result.user.email,
      vaultId: result.vault.id
    });

    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        status: result.user.status.toUpperCase() // Normalize to uppercase
      },
      vault: {
        id: result.vault.id,
        tier: result.vault.tier.toUpperCase(), // Normalize to uppercase
        storageUsed: result.vault.storageUsedBytes.toString(),
        storageLimit: result.vault.storageLimitBytes.toString(),
        uploadsThisWeek: result.vault.uploadCountThisWeek,
        uploadLimit: result.vault.uploadLimitWeekly
      },
      token,
      vmkSalt // Client uses this to derive encryption key
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    ValidationUtils.validateEmail(email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { vault: true }
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValid = await CryptoUtils.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastCheckIn: new Date() }
    });

    const token = JWTUtils.sign({
      userId: user.id,
      email: user.email,
      vaultId: user.vault?.id
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        status: user.status.toUpperCase() // Normalize to uppercase
      },
      vault: user.vault ? {
        id: user.vault.id,
        tier: user.vault.tier.toUpperCase(), // Normalize to uppercase
        storageUsed: user.vault.storageUsedBytes.toString(),
        storageLimit: user.vault.storageLimitBytes.toString(),
        uploadsThisWeek: user.vault.uploadCountThisWeek,
        uploadLimit: user.vault.uploadLimitWeekly
      } : null,
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { vault: true }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        status: user.status.toUpperCase(), // Normalize to uppercase
        nextCheckIn: user.nextCheckIn
      },
      vault: user.vault ? {
        id: user.vault.id,
        tier: user.vault.tier.toUpperCase(), // Normalize to uppercase
        storageUsed: user.vault.storageUsedBytes.toString(),
        storageLimit: user.vault.storageLimitBytes.toString(),
        uploadsThisWeek: user.vault.uploadCountThisWeek,
        uploadLimit: user.vault.uploadLimitWeekly
      } : null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/check-in-response
 * User responds to check-in (via email link)
 */
router.post('/check-in-response', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError(400, 'Token is required');
    }

    const payload = JWTUtils.verify(token);
    
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        status: 'ALIVE',
        lastCheckIn: new Date(),
        nextCheckIn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    });

    await prisma.checkIn.updateMany({
      where: {
        userId: user.id,
        respondedAt: null
      },
      data: {
        respondedAt: new Date(),
        responseMethod: 'link_click'
      }
    });

    res.json({
      success: true,
      message: 'Check-in confirmed',
      nextCheckIn: user.nextCheckIn
    });
  } catch (error) {
    next(error);
  }
});

export default router;
