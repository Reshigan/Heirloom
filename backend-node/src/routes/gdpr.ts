import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import archiver from 'archiver';
import { Readable } from 'stream';

const router = Router();

router.use(authenticate);

/**
 * GDPR Data Export - Download all user data in JSON format
 */
router.get('/export', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vault: {
          include: {
            items: true,
            recipients: true,
            trustedContacts: true,
          },
        },
        checkIns: true,
        notifications: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        status: user.status,
        notificationSettings: user.notificationSettings,
      },
      vault: user.vault ? {
        id: user.vault.id,
        tier: user.vault.tier,
        createdAt: user.vault.createdAt,
        uploadCountThisWeek: user.vault.uploadCountThisWeek,
        uploadLimitWeekly: user.vault.uploadLimitWeekly,
        items: user.vault.items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          createdAt: item.createdAt,
          fileSizeBytes: item.fileSizeBytes,
          mimeType: item.mimeType,
          tags: item.tags,
        })),
        recipients: user.vault.recipients.map(r => ({
          id: r.id,
          email: r.email,
          name: r.name,
          relationship: r.relationship,
          createdAt: r.createdAt,
        })),
        trustedContacts: user.vault.trustedContacts.map(tc => ({
          id: tc.id,
          email: tc.email,
          name: tc.name,
          createdAt: tc.createdAt,
        })),
      } : null,
      checkIns: user.checkIns.map(ci => ({
        id: ci.id,
        sentAt: ci.sentAt,
        respondedAt: ci.respondedAt,
        missed: ci.missed,
      })),
      notifications: user.notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        createdAt: n.createdAt,
        readAt: n.readAt,
      })),
      exportedAt: new Date().toISOString(),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="heirloom-data-export-${userId}-${Date.now()}.json"`);
    
    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

/**
 * GDPR Data Delete - Request account deletion
 */
router.post('/delete-account', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      throw new AppError(400, 'Invalid confirmation. Please type "DELETE_MY_ACCOUNT" to confirm.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { vault: true },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'pending_deletion',
        gracePeriodEnd: deletionDate,
      },
    });


    res.json({
      success: true,
      message: 'Account deletion requested. Your account will be permanently deleted after 30 days.',
      deletionDate: deletionDate.toISOString(),
      cancellationInstructions: 'To cancel deletion, contact support@heirloom.app within 30 days.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Cancel account deletion
 */
router.post('/cancel-deletion', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.status !== 'pending_deletion') {
      throw new AppError(400, 'No pending deletion request found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'alive',
        gracePeriodEnd: null,
      },
    });

    res.json({
      success: true,
      message: 'Account deletion cancelled successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get GDPR compliance information
 */
router.get('/info', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        status: true,
        gracePeriodEnd: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      dataController: {
        name: 'Heirloom',
        email: 'privacy@heirloom.app',
        dpo: 'dpo@heirloom.app',
      },
      yourRights: [
        'Right to access your personal data',
        'Right to rectification of inaccurate data',
        'Right to erasure (right to be forgotten)',
        'Right to data portability',
        'Right to restrict processing',
        'Right to object to processing',
        'Right to withdraw consent',
        'Right to lodge a complaint with a supervisory authority',
      ],
      dataRetention: {
        activeAccount: 'Data retained while account is active',
        afterDeletion: 'Data permanently deleted 30 days after deletion request',
        backups: 'Backup data retained for 90 days for disaster recovery',
      },
      accountStatus: {
        status: user.status,
        pendingDeletion: user.status === 'pending_deletion',
        deletionDate: user.gracePeriodEnd?.toISOString() || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
