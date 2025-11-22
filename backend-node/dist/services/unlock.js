"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnlockService = void 0;
const index_1 = require("../index");
const notifications_1 = require("./notifications");
const crypto_1 = __importDefault(require("crypto"));
class UnlockService {
    notificationService;
    constructor() {
        this.notificationService = new notifications_1.NotificationService();
    }
    async unlockVault(vaultId) {
        const vault = await index_1.prisma.vault.findUnique({
            where: { id: vaultId },
            include: {
                user: true,
                recipients: true
            }
        });
        if (!vault) {
            throw new Error('Vault not found');
        }
        await index_1.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: vault.userId },
                data: { status: 'unlocked' }
            });
            for (const recipient of vault.recipients) {
                const accessToken = crypto_1.default.randomBytes(32).toString('hex');
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
                        unlockedAt: new Date().toISOString()
                    }
                }
            });
        });
        await this.notificationService.notifyRecipients(vaultId);
        console.log(`🔓 Vault ${vaultId} unlocked and recipients notified`);
    }
    async initiateUnlockRequest(vaultId, initiatedBy) {
        const vault = await index_1.prisma.vault.findUnique({
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
        const unlockRequest = await index_1.prisma.unlockRequest.create({
            data: {
                vaultId,
                initiatedBy,
                status: 'pending',
                confirmationsCount: 0,
                gracePeriodEnd
            }
        });
        await index_1.prisma.auditLog.create({
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
    async confirmDeath(contactId) {
        const contact = await index_1.prisma.trustedContact.findUnique({
            where: { id: contactId },
            include: { user: { include: { vault: true } } }
        });
        if (!contact) {
            throw new Error('Trusted contact not found');
        }
        if (contact.confirmedDeath) {
            throw new Error('Already confirmed');
        }
        await index_1.prisma.trustedContact.update({
            where: { id: contactId },
            data: {
                confirmedDeath: true,
                confirmedAt: new Date()
            }
        });
        const confirmationCount = await index_1.prisma.trustedContact.count({
            where: {
                userId: contact.userId,
                confirmedDeath: true
            }
        });
        console.log(`✅ Trusted contact confirmed death (${confirmationCount}/3)`);
        if (confirmationCount >= 2 && contact.user.vault) {
            let unlockRequest = await index_1.prisma.unlockRequest.findFirst({
                where: {
                    vaultId: contact.user.vault.id,
                    status: 'pending'
                }
            });
            if (!unlockRequest) {
                unlockRequest = await this.initiateUnlockRequest(contact.user.vault.id, `trusted-contact-${contactId}`);
            }
            await index_1.prisma.unlockRequest.update({
                where: { id: unlockRequest.id },
                data: {
                    confirmationsCount: confirmationCount
                }
            });
            console.log(`🔓 2-of-3 threshold reached, unlock request updated`);
        }
        return { confirmationCount, thresholdReached: confirmationCount >= 2 };
    }
    async cancelUnlockRequest(requestId, reason) {
        const request = await index_1.prisma.unlockRequest.findUnique({
            where: { id: requestId }
        });
        if (!request) {
            throw new Error('Unlock request not found');
        }
        await index_1.prisma.unlockRequest.update({
            where: { id: requestId },
            data: {
                status: 'cancelled',
                completedAt: new Date()
            }
        });
        await index_1.prisma.auditLog.create({
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
exports.UnlockService = UnlockService;
