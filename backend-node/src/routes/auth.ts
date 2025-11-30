import { Router } from 'express';
import { prisma } from '../db';
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
      throw new AppError(400, 'Email already registered');
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
          vmkSalt,
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

    res.cookie('heirloom_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    const defaultUploadLimit = process.env.UPLOAD_LIMIT_WEEKLY 
      ? parseInt(process.env.UPLOAD_LIMIT_WEEKLY, 10) 
      : 100;

    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        status: (result.user.status || 'ALIVE').toUpperCase()
      },
      vault: {
        id: result.vault.id,
        tier: (result.vault.tier || 'STARTER').toUpperCase(),
        storageUsed: String(result.vault.storageUsedBytes ?? 0n),
        storageLimit: String(result.vault.storageLimitBytes ?? 0n),
        uploadsThisWeek: result.vault.uploadCountThisWeek ?? 0,
        uploadLimit: result.vault.uploadLimitWeekly ?? defaultUploadLimit
      },
      token,
      vmkSalt
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

    let vault = user.vault;
    if (!vault) {
      vault = await prisma.vault.findUnique({
        where: { userId: user.id }
      });
    }

    const token = JWTUtils.sign({
      userId: user.id,
      email: user.email,
      vaultId: vault?.id
    });

    res.cookie('heirloom_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        status: (user.status || 'ALIVE').toUpperCase()
      },
      vault: vault ? {
        id: vault.id,
        tier: (vault.tier || 'STARTER').toUpperCase(),
        storageUsed: String(vault.storageUsedBytes ?? 0n),
        storageLimit: String(vault.storageLimitBytes ?? 0n),
        uploadsThisWeek: vault.uploadCountThisWeek ?? 0,
        uploadLimit: vault.uploadLimitWeekly ?? 100
      } : null,
      token,
      vmkSalt: vault?.vmkSalt ?? null
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
 * POST /api/auth/logout
 * Logout user and clear cookie
 */
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    res.clearCookie('heirloom_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
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

router.use((err: any, req: any, res: any, next: any) => {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message || 'Internal server error' });
});

export default router;
