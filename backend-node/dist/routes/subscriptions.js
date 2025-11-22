"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/current', async (req, res, next) => {
    try {
        const vault = await index_1.prisma.vault.findUnique({
            where: { userId: req.user.userId }
        });
        if (!vault) {
            throw new errorHandler_1.AppError(404, 'Vault not found');
        }
        const subscription = await index_1.prisma.subscription.findFirst({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            tier: vault.tier,
            subscription: subscription ? {
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd
            } : null
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
