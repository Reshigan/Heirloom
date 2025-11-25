import { prisma } from '../index';
import { NotificationService } from './notifications';
import crypto from 'crypto';

export class UnlockService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async unlockVault(vaultId: string) {
    const vault = await prisma.vault.findUnique({
      where: { id: vaultId },
      include: {
        user: {
          include: {
            legacyPolicy: true
          }
        },
        recipients: true
      }
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: vault.userId },
        data: { status: 'deceased' }
      });

      const legacyPolicy = vault.user.legacyPolicy;
      if (legacyPolicy) {
        await tx.vaultItem.updateMany({
          where: {
            vaultId: vault.id,
            visibility: 'POSTHUMOUS'
          },
          data: {
            visibility: 'POSTHUMOUS'
          }
        });
      }

      for (const recipient of vault.recipients) {
        const accessToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 10);

        await tx.recipient.update({
          where: { id: recipient.id },
          data: {
            accessToken,
            accessExpiresAt: expiresAt
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: vault.userId,
          action: 'vault_unlocked',
          details: {
            vaultId: vault.id,
            recipientCount: vault.recipients.length,
            unlockedAt: new Date().toISOString(),
            posthumousMemoriesCount: await tx.vaultItem.count({
              where: {
                vaultId: vault.id,
                visibility: 'POSTHUMOUS'
              }
            })
          }
        }
      });
    });

    await this.notificationService.notifyRecipients(vaultId);

    console.log(`🔓 Vault ${vaultId} unlocked (owner deceased) and recipients notified`);
  }

  async initiateUnlockRequest(vaultId: string, initiatedBy: string) {
    const vault = await prisma.vault.findUnique({
      where: { id: vaultId },
      include: { user: true }
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    if (vault.user.status !== 'escalation') {
      throw new Error('Vault is not in escalation status');
    }

    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);

    const unlockRequest = await prisma.unlockRequest.create({
      data: {
        vaultId,
        initiatedBy,
        status: 'pending',
        confirmationsCount: 0,
        gracePeriodEnd
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: vault.userId,
        action: 'unlock_request_initiated',
        details: {
          requestId: unlockRequest.id,
          initiatedBy,
          gracePeriodEnd: gracePeriodEnd.toISOString()
        }
      }
    });

    console.log(`🔐 Unlock request initiated for vault ${vaultId}`);

    return unlockRequest;
  }

  async confirmDeath(contactId: string) {
    const contact = await prisma.trustedContact.findUnique({
      where: { id: contactId },
      include: { user: { include: { vault: true } } }
    });

    if (!contact) {
      throw new Error('Trusted contact not found');
    }

    if (contact.confirmedDeath) {
      throw new Error('Already confirmed');
    }

    await prisma.trustedContact.update({
      where: { id: contactId },
      data: {
        confirmedDeath: true,
        confirmedAt: new Date()
      }
    });

    const confirmationCount = await prisma.trustedContact.count({
      where: {
        userId: contact.userId,
        confirmedDeath: true
      }
    });

    console.log(`✅ Trusted contact confirmed death (${confirmationCount}/3)`);

    if (confirmationCount >= 2 && contact.user.vault) {
      let unlockRequest = await prisma.unlockRequest.findFirst({
        where: {
          vaultId: contact.user.vault.id,
          status: 'pending'
        }
      });

      if (!unlockRequest) {
        unlockRequest = await this.initiateUnlockRequest(
          contact.user.vault.id,
          `trusted-contact-${contactId}`
        );
      }

      await prisma.unlockRequest.update({
        where: { id: unlockRequest.id },
        data: {
          confirmationsCount: confirmationCount
        }
      });

      console.log(`🔓 2-of-3 threshold reached, unlock request updated`);
    }

    return { confirmationCount, thresholdReached: confirmationCount >= 2 };
  }

  async cancelUnlockRequest(requestId: string, reason: string) {
    const request = await prisma.unlockRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Unlock request not found');
    }

    await prisma.unlockRequest.update({
      where: { id: requestId },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'unlock_request_cancelled',
        details: {
          requestId,
          reason,
          cancelledAt: new Date().toISOString()
        }
      }
    });

    console.log(`❌ Unlock request ${requestId} cancelled: ${reason}`);
  }
}
