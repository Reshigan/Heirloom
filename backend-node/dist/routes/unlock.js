"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const unlock_1 = require("../services/unlock");
const router = (0, express_1.Router)();
const unlockService = new unlock_1.UnlockService();
router.post('/verify-death/:token', async (req, res, next) => {
    try {
        const { token } = req.params;
        const contact = await index_1.prisma.trustedContact.findFirst({
            where: { verificationToken: token }
        });
        if (!contact) {
            throw new errorHandler_1.AppError(404, 'Invalid verification token');
        }
        const result = await unlockService.confirmDeath(contact.id);
        res.json({
            success: true,
            confirmationCount: result.confirmationCount,
            thresholdReached: result.thresholdReached,
            message: result.thresholdReached
                ? 'Threshold reached. Vault will be unlocked after grace period.'
                : `Confirmation recorded (${result.confirmationCount}/2)`
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/requests', auth_1.authenticate, async (req, res, next) => {
    try {
        const vault = await index_1.prisma.vault.findUnique({
            where: { userId: req.user.userId }
        });
        if (!vault) {
            throw new errorHandler_1.AppError(404, 'Vault not found');
        }
        const requests = await index_1.prisma.unlockRequest.findMany({
            where: { vaultId: vault.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ requests });
    }
    catch (error) {
        next(error);
    }
});
router.post('/cancel/:requestId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        await unlockService.cancelUnlockRequest(requestId, reason || 'User cancelled');
        const vault = await index_1.prisma.vault.findUnique({
            where: { userId: req.user.userId }
        });
        if (vault) {
            await index_1.prisma.user.update({
                where: { id: req.user.userId },
                data: {
                    status: 'alive',
                    lastCheckIn: new Date(),
                    nextCheckIn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    gracePeriodEnd: null
                }
            });
        }
        res.json({
            success: true,
            message: 'Unlock request cancelled and status reset to alive'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
