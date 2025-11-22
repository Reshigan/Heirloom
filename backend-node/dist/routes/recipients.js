"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', async (req, res, next) => {
    try {
        const { email, name, relationship, accessLevel } = req.body;
        if (!email) {
            throw new errorHandler_1.AppError(400, 'Email is required');
        }
        const vault = await index_1.prisma.vault.findUnique({
            where: { userId: req.user.userId },
            include: { recipients: true }
        });
        if (!vault) {
            throw new errorHandler_1.AppError(404, 'Vault not found');
        }
        const limits = {
            STARTER: 10,
            FAMILY: 50,
            UNLIMITED: 999999,
            LIFETIME: 999999
        };
        if (vault.recipients.length >= limits[vault.tier]) {
            throw new errorHandler_1.AppError(403, `Recipient limit reached for ${vault.tier} tier`);
        }
        const recipient = await index_1.prisma.recipient.create({
            data: {
                vaultId: vault.id,
                email,
                name,
                relationship,
                accessLevel: accessLevel || 'SPECIFIC'
            }
        });
        res.status(201).json({
            recipient: {
                id: recipient.id,
                email: recipient.email,
                name: recipient.name,
                relationship: recipient.relationship,
                accessLevel: recipient.accessLevel,
                createdAt: recipient.createdAt
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/', async (req, res, next) => {
    try {
        const vault = await index_1.prisma.vault.findUnique({
            where: { userId: req.user.userId },
            include: {
                recipients: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!vault) {
            throw new errorHandler_1.AppError(404, 'Vault not found');
        }
        res.json({
            recipients: vault.recipients.map((r) => ({
                id: r.id,
                email: r.email,
                name: r.name,
                relationship: r.relationship,
                accessLevel: r.accessLevel,
                createdAt: r.createdAt
            }))
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
