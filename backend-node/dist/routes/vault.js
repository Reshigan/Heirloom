"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/items', async (req, res, next) => {
    try {
        const { type, title, encryptedData, encryptedDek, thumbnailUrl, fileSizeBytes, recipientIds, scheduledDelivery, emotionCategory, importanceScore } = req.body;
        if (!type || !encryptedData || !encryptedDek) {
            throw new errorHandler_1.AppError(400, 'Type, encrypted data, and encrypted DEK are required');
        }
        const vault = await index_1.prisma.vault.findUnique({
            where: { userId: req.user.userId }
        });
        if (!vault) {
            throw new errorHandler_1.AppError(404, 'Vault not found');
        }
        if (vault.uploadCountThisWeek >= vault.uploadLimitWeekly) {
            throw new errorHandler_1.AppError(429, 'Weekly upload limit reached. Resets on Monday.');
        }
        const newStorageUsed = vault.storageUsedBytes + BigInt(fileSizeBytes || 0);
        if (newStorageUsed > vault.storageLimitBytes) {
            throw new errorHandler_1.AppError(413, 'Storage limit exceeded');
        }
        const item = await index_1.prisma.$transaction(async (tx) => {
            const newItem = await tx.vaultItem.create({
                data: {
                    vaultId: vault.id,
                    type,
                    title,
                    encryptedData,
                    encryptedDek,
                    thumbnailUrl,
                    fileSizeBytes: fileSizeBytes ? BigInt(fileSizeBytes) : null,
                    recipientIds: recipientIds || [],
                    scheduledDelivery: scheduledDelivery ? new Date(scheduledDelivery) : null,
                    emotionCategory,
                    importanceScore: importanceScore || 5
                }
            });
            await tx.vault.update({
                where: { id: vault.id },
                data: {
                    storageUsedBytes: newStorageUsed,
                    uploadCountThisWeek: vault.uploadCountThisWeek + 1
                }
            });
            return newItem;
        });
        const updatedVault = await index_1.prisma.vault.findUnique({
            where: { id: vault.id }
        });
        res.status(201).json({
            item: {
                id: item.id,
                type: item.type,
                title: item.title,
                thumbnailUrl: item.thumbnailUrl,
                emotionCategory: item.emotionCategory,
                importanceScore: item.importanceScore,
                createdAt: item.createdAt
            },
            vault: {
                storageUsed: updatedVault.storageUsedBytes.toString(),
                storageLimit: updatedVault.storageLimitBytes.toString(),
                uploadsRemaining: updatedVault.uploadLimitWeekly - updatedVault.uploadCountThisWeek
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/upload', async (req, res, next) => {
    try {
        const { type, title, encryptedData, encryptedDek, thumbnailUrl, fileSizeBytes, recipientIds, scheduledDelivery, emotionCategory, importanceScore } = req.body;
        if (!type || !encryptedData || !encryptedDek) {
            throw new errorHandler_1.AppError(400, 'Type, encrypted data, and encrypted DEK are required');
        }
        const vault = await index_1.prisma.vault.findUnique({
            where: { userId: req.user.userId }
        });
        if (!vault) {
            throw new errorHandler_1.AppError(404, 'Vault not found');
        }
        if (vault.uploadCountThisWeek >= vault.uploadLimitWeekly) {
            throw new errorHandler_1.AppError(429, 'Weekly upload limit reached. Resets on Monday.');
        }
        const newStorageUsed = vault.storageUsedBytes + BigInt(fileSizeBytes || 0);
        if (newStorageUsed > vault.storageLimitBytes) {
            throw new errorHandler_1.AppError(413, 'Storage limit exceeded');
        }
        const item = await index_1.prisma.$transaction(async (tx) => {
            const newItem = await tx.vaultItem.create({
                data: {
                    vaultId: vault.id,
                    type,
                    title,
                    encryptedData,
                    encryptedDek,
                    thumbnailUrl,
                    fileSizeBytes: fileSizeBytes ? BigInt(fileSizeBytes) : null,
                    recipientIds: recipientIds || [],
                    scheduledDelivery: scheduledDelivery ? new Date(scheduledDelivery) : null,
                    emotionCategory,
                    importanceScore: importanceScore || 5
                }
            });
            await tx.vault.update({
                where: { id: vault.id },
                data: {
                    storageUsedBytes: newStorageUsed,
                    uploadCountThisWeek: vault.uploadCountThisWeek + 1
                }
            });
            return newItem;
        });
        const updatedVault = await index_1.prisma.vault.findUnique({
            where: { id: vault.id }
        });
        res.status(201).json({
            item: {
                id: item.id,
                type: item.type,
                title: item.title,
                thumbnailUrl: item.thumbnailUrl,
                emotionCategory: item.emotionCategory,
                importanceScore: item.importanceScore,
                createdAt: item.createdAt
            },
            vault: {
                storageUsed: updatedVault.storageUsedBytes.toString(),
                storageLimit: updatedVault.storageLimitBytes.toString(),
                uploadsRemaining: updatedVault.uploadLimitWeekly - updatedVault.uploadCountThisWeek
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/items', async (req, res, next) => {
    try {
        const { type, limit = '50', offset = '0' } = req.query;
        const vault = await index_1.prisma.vault.findUnique({
            where: { userId: req.user.userId }
        });
        if (!vault) {
            throw new errorHandler_1.AppError(404, 'Vault not found');
        }
        const where = { vaultId: vault.id };
        if (type) {
            where.type = type;
        }
        const [items, total] = await Promise.all([
            index_1.prisma.vaultItem.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            }),
            index_1.prisma.vaultItem.count({ where })
        ]);
        res.json({
            items: items.map((item) => ({
                id: item.id,
                type: item.type,
                title: item.title,
                thumbnailUrl: item.thumbnailUrl,
                emotionCategory: item.emotionCategory,
                importanceScore: item.importanceScore,
                recipientIds: item.recipientIds,
                scheduledDelivery: item.scheduledDelivery,
                createdAt: item.createdAt
            })),
            total,
            vault: {
                storageUsed: vault.storageUsedBytes.toString(),
                storageLimit: vault.storageLimitBytes.toString(),
                uploadsThisWeek: vault.uploadCountThisWeek,
                uploadLimit: vault.uploadLimitWeekly
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/stats', async (req, res, next) => {
    try {
        const vault = await index_1.prisma.vault.findUnique({
            where: { userId: req.user.userId },
            include: {
                items: {
                    select: {
                        type: true,
                        emotionCategory: true
                    }
                },
                recipients: {
                    select: { id: true }
                }
            }
        });
        if (!vault) {
            throw new errorHandler_1.AppError(404, 'Vault not found');
        }
        const itemsByType = vault.items.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {});
        const itemsByEmotion = vault.items.reduce((acc, item) => {
            if (item.emotionCategory) {
                acc[item.emotionCategory] = (acc[item.emotionCategory] || 0) + 1;
            }
            return acc;
        }, {});
        const now = new Date();
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        const nextReset = new Date(now);
        nextReset.setDate(now.getDate() + daysUntilMonday);
        nextReset.setHours(0, 0, 0, 0);
        res.json({
            storage: {
                used: vault.storageUsedBytes.toString(),
                limit: vault.storageLimitBytes.toString(),
                percentUsed: Number((vault.storageUsedBytes * BigInt(100)) / vault.storageLimitBytes)
            },
            uploads: {
                thisWeek: vault.uploadCountThisWeek,
                limit: vault.uploadLimitWeekly,
                remaining: vault.uploadLimitWeekly - vault.uploadCountThisWeek,
                nextReset
            },
            items: {
                total: vault.items.length,
                byType: itemsByType,
                byEmotion: itemsByEmotion
            },
            recipients: {
                total: vault.recipients.length
            },
            tier: vault.tier
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
