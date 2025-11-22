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
        const { method = 'manual' } = req.body;
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.user.userId }
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        const nextCheckIn = new Date();
        nextCheckIn.setDate(nextCheckIn.getDate() + user.checkInIntervalDays);
        await index_1.prisma.user.update({
            where: { id: user.id },
            data: {
                status: 'alive',
                lastCheckIn: new Date(),
                nextCheckIn,
                gracePeriodEnd: null
            }
        });
        await index_1.prisma.checkIn.create({
            data: {
                userId: user.id,
                sentAt: new Date(),
                sentVia: method,
                respondedAt: new Date(),
                responseMethod: method,
                missed: false
            }
        });
        res.json({
            success: true,
            message: 'Check-in recorded successfully',
            nextCheckIn,
            status: 'alive'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/status', async (req, res, next) => {
    try {
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                checkIns: {
                    orderBy: { sentAt: 'desc' },
                    take: 5
                }
            }
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        const missedCount = user.checkIns.filter((c) => c.missed).length;
        res.json({
            status: user.status,
            nextCheckIn: user.nextCheckIn,
            intervalDays: user.checkInIntervalDays,
            missedCount,
            recentCheckIns: user.checkIns.map((c) => ({
                sentAt: c.sentAt,
                respondedAt: c.respondedAt,
                missed: c.missed
            }))
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
