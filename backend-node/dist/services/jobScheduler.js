"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobScheduler = void 0;
const index_1 = require("../index");
const notifications_1 = require("./notifications");
const unlock_1 = require("./unlock");
const cron = __importStar(require("node-cron"));
class JobScheduler {
    tasks = [];
    notificationService;
    unlockService;
    constructor() {
        this.notificationService = new notifications_1.NotificationService();
        this.unlockService = new unlock_1.UnlockService();
    }
    async start() {
        console.log('📅 Starting job scheduler with node-cron...');
        // Schedule missed check-in processor (every 6 hours)
        const missedCheckInsTask = cron.schedule('0 */6 * * *', async () => {
            console.log('⚠️  Running missed check-ins processor...');
            try {
                await this.processMissedCheckIns();
            }
            catch (error) {
                console.error('❌ Error processing missed check-ins:', error);
            }
        }, {
            timezone: 'UTC'
        });
        this.tasks.push(missedCheckInsTask);
        // Schedule weekly upload reset (Mondays at midnight UTC)
        const weeklyResetTask = cron.schedule('0 0 * * 1', async () => {
            console.log('🔄 Running weekly upload reset...');
            try {
                await this.resetWeeklyUploads();
            }
            catch (error) {
                console.error('❌ Error resetting weekly uploads:', error);
            }
        }, {
            timezone: 'UTC'
        });
        this.tasks.push(weeklyResetTask);
        // Schedule unlock request processor (hourly)
        const unlockRequestsTask = cron.schedule('0 * * * *', async () => {
            console.log('🔓 Running unlock requests processor...');
            try {
                await this.processUnlockRequests();
            }
            catch (error) {
                console.error('❌ Error processing unlock requests:', error);
            }
        }, {
            timezone: 'UTC'
        });
        this.tasks.push(unlockRequestsTask);
        console.log('✅ All scheduled jobs registered with node-cron');
        console.log('   - Missed check-ins: Every 6 hours');
        console.log('   - Weekly upload reset: Mondays at midnight UTC');
        console.log('   - Unlock requests: Hourly');
    }
    async stop() {
        console.log('📅 Stopping job scheduler...');
        this.tasks.forEach(task => task.stop());
        this.tasks = [];
        console.log('✅ Job scheduler stopped');
    }
    async scheduleCheckInReminder(userId, nextCheckIn) {
        // Calculate reminder date (7 days before check-in)
        const reminderDate = new Date(nextCheckIn.getTime() - 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        if (reminderDate <= now) {
            console.log(`⚠️  Reminder date for user ${userId} is in the past, skipping`);
            return;
        }
        // Calculate delay in milliseconds
        const delay = reminderDate.getTime() - now.getTime();
        // Schedule one-time reminder using setTimeout
        setTimeout(async () => {
            try {
                await this.sendCheckInReminder(userId);
            }
            catch (error) {
                console.error(`❌ Error sending check-in reminder to user ${userId}:`, error);
            }
        }, delay);
        console.log(`📅 Scheduled check-in reminder for user ${userId} at ${reminderDate.toISOString()}`);
    }
    async sendCheckInReminder(userId) {
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || user.status !== 'alive') {
            return;
        }
        await this.notificationService.sendCheckInReminder(user.email, user.nextCheckIn);
        await index_1.prisma.checkIn.create({
            data: {
                userId: user.id,
                sentAt: new Date(),
                sentVia: 'email',
                missed: false
            }
        });
        console.log(`✉️ Sent check-in reminder to ${user.email}`);
    }
    async processMissedCheckIns() {
        const now = new Date();
        const overdueUsers = await index_1.prisma.user.findMany({
            where: {
                nextCheckIn: { lt: now },
                status: { in: ['alive', 'missed_one', 'missed_two'] }
            }
        });
        console.log(`🔍 Processing ${overdueUsers.length} overdue users`);
        for (const user of overdueUsers) {
            await this.processUserStatus(user);
        }
    }
    async processUserStatus(user) {
        const now = new Date();
        const daysSinceCheckIn = user.lastCheckIn
            ? Math.floor((now.getTime() - user.lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))
            : 999;
        let newStatus = user.status;
        let gracePeriodEnd = user.gracePeriodEnd;
        if (user.status === 'alive' && daysSinceCheckIn > 90) {
            newStatus = 'missed_one';
            await this.notificationService.sendMissedCheckInAlert(user.email, 1);
            console.log(`⚠️ User ${user.email} missed first check-in`);
        }
        else if (user.status === 'missed_one' && daysSinceCheckIn > 120) {
            newStatus = 'missed_two';
            await this.notificationService.sendMissedCheckInAlert(user.email, 2);
            console.log(`⚠️ User ${user.email} missed second check-in`);
        }
        else if (user.status === 'missed_two' && daysSinceCheckIn > 150) {
            newStatus = 'escalation';
            gracePeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            await this.notificationService.sendEscalationAlert(user.email);
            await this.notificationService.notifyTrustedContacts(user.id);
            console.log(`🚨 User ${user.email} escalated to trusted contacts`);
        }
        if (newStatus !== user.status) {
            await index_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    status: newStatus,
                    gracePeriodEnd
                }
            });
            await index_1.prisma.checkIn.updateMany({
                where: {
                    userId: user.id,
                    respondedAt: null
                },
                data: { missed: true }
            });
        }
    }
    async resetWeeklyUploads() {
        const result = await index_1.prisma.vault.updateMany({
            where: { uploadCountThisWeek: { gt: 0 } },
            data: { uploadCountThisWeek: 0 }
        });
        console.log(`🔄 Reset weekly upload counters for ${result.count} vaults`);
    }
    async processUnlockRequests() {
        const now = new Date();
        const expiredRequests = await index_1.prisma.unlockRequest.findMany({
            where: {
                status: 'pending',
                gracePeriodEnd: { lt: now }
            },
            include: { vault: true }
        });
        console.log(`🔓 Processing ${expiredRequests.length} expired unlock requests`);
        for (const request of expiredRequests) {
            if (request.confirmationsCount >= 2) {
                await this.unlockService.unlockVault(request.vaultId);
                await index_1.prisma.unlockRequest.update({
                    where: { id: request.id },
                    data: {
                        status: 'approved',
                        completedAt: now
                    }
                });
                console.log(`✅ Vault ${request.vaultId} unlocked after grace period`);
            }
            else {
                await index_1.prisma.unlockRequest.update({
                    where: { id: request.id },
                    data: {
                        status: 'cancelled',
                        completedAt: now
                    }
                });
                console.log(`❌ Unlock request ${request.id} cancelled (insufficient confirmations)`);
            }
        }
    }
}
exports.JobScheduler = JobScheduler;
