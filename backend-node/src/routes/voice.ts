import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ValidationUtils } from '../utils/validation';

const router = Router();

router.use(authenticate);

/**
 * POST /api/voice
 * Upload a voice recording
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const {
      title,
      encryptedData,
      encryptedDek,
      duration,
      fileSizeBytes,
      transcription
    } = req.body;

    if (!encryptedData || !encryptedDek) {
      throw new AppError(400, 'Encrypted data and DEK are required');
    }

    if (title) {
      ValidationUtils.validateTitle(title);
    }

    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const uploadCount = vault.uploadCountThisWeek ?? 0;
    const uploadLimit = vault.uploadLimitWeekly ?? 100;

    if (uploadCount >= uploadLimit) {
      throw new AppError(429, 'Upload limit exceeded. Weekly limit reached.');
    }

    const newStorageUsed = vault.storageUsedBytes + BigInt(fileSizeBytes || 0);
    if (newStorageUsed > vault.storageLimitBytes) {
      throw new AppError(413, 'Storage limit exceeded');
    }

    const recording = await prisma.$transaction(async (tx: any) => {
      await tx.vault.update({
        where: { id: vault.id },
        data: {
          uploadCountThisWeek: { increment: 1 },
          storageUsedBytes: newStorageUsed
        }
      });

      const newRecording = await tx.vaultItem.create({
        data: {
          vaultId: vault.id,
          type: 'voice',
          title: title || 'Untitled Recording',
          encryptedData,
          encryptedDek,
          fileSizeBytes: fileSizeBytes ? BigInt(fileSizeBytes) : null,
          recipientIds: [],
          emotionCategory: 'neutral',
          importanceScore: 5,
          visibility: 'PRIVATE'
        }
      });

      return newRecording;
    });

    res.status(201).json({
      id: recording.id,
      title: recording.title,
      duration: duration || 0,
      date: recording.createdAt,
      transcription: transcription || null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/voice
 * Get all voice recordings for the user
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const recordings = await prisma.vaultItem.findMany({
      where: {
        vaultId: vault.id,
        type: 'voice'
      },
      orderBy: { createdAt: 'desc' }
    });

    const recordingsData = recordings.map((recording: any) => ({
      id: recording.id,
      title: recording.title,
      duration: 0,
      date: recording.createdAt,
      transcription: null
    }));

    res.json(recordingsData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/voice/:id
 * Get a specific voice recording
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const recording = await prisma.vaultItem.findFirst({
      where: {
        id,
        vaultId: vault.id,
        type: 'voice'
      }
    });

    if (!recording) {
      throw new AppError(404, 'Recording not found');
    }

    res.json({
      id: recording.id,
      title: recording.title,
      encryptedData: recording.encryptedData,
      encryptedDek: recording.encryptedDek,
      duration: 0,
      date: recording.createdAt,
      transcription: null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/voice/:id
 * Update a voice recording
 */
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { title, transcription } = req.body;

    if (title !== undefined && title !== null) {
      ValidationUtils.validateTitle(title);
    }

    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const existingRecording = await prisma.vaultItem.findFirst({
      where: {
        id,
        vaultId: vault.id,
        type: 'voice'
      }
    });

    if (!existingRecording) {
      throw new AppError(404, 'Recording not found');
    }

    const updatedRecording = await prisma.vaultItem.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingRecording.title
      }
    });

    res.json({
      id: updatedRecording.id,
      title: updatedRecording.title,
      duration: 0,
      date: updatedRecording.createdAt,
      transcription: transcription || null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/voice/:id
 * Delete a voice recording
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const vault = await prisma.vault.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!vault) {
      throw new AppError(404, 'Vault not found');
    }

    const recording = await prisma.vaultItem.findFirst({
      where: {
        id,
        vaultId: vault.id,
        type: 'voice'
      }
    });

    if (!recording) {
      throw new AppError(404, 'Recording not found');
    }

    await prisma.vaultItem.delete({
      where: { id }
    });

    res.json({
      message: 'Recording deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
