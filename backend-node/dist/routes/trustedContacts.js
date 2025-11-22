"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const crypto_1 = require("../utils/crypto");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', async (req, res, next) => {
    try {
        const { email, phone, name, shamirShareEncrypted } = req.body;
        if (!email) {
            throw new errorHandler_1.AppError(400, 'Email is required');
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { trustedContacts: true }
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        if (user.trustedContacts.length >= 5) {
            throw new errorHandler_1.AppError(403, 'Maximum 5 trusted contacts allowed');
        }
        const verificationToken = crypto_1.CryptoUtils.generateToken();
        const contact = await index_1.prisma.trustedContact.create({
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/', async (req, res, next) => {
    try {
        const contacts = await index_1.prisma.trustedContact.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            contacts: contacts.map((c) => ({
                id: c.id,
                email: c.email,
                name: c.name,
                verificationStatus: c.verificationStatus,
                createdAt: c.createdAt
            }))
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
