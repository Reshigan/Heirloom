"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobScheduler = void 0;
const index_1 = require("../index");
const notifications_1 = require("./notifications");
const unlock_1 = require("./unlock");
const pg_boss_1 = __importDefault(require("pg-boss"));
class JobScheduler {
    boss;
    notificationService;
    unlockService;
    constructor() {
        this.boss = new pg_boss_1.default({
            connectionString: process.env.DATABASE_URL,
            schema: 'pgboss'
        });
        this.notificationService = new notifications_1.NotificationService();
        this.unlockService = new unlock_1.UnlockService();
    }
    async start() {
        await this.boss.start();
        console.log('📅 Job scheduler started');
        await this.registerJobs();
        await this.scheduleRecurringJobs();
    }
    async stop() {
        await this.boss.stop();
        console.log('📅 Job scheduler stopped');
    }
    async registerJobs() {
        await this.boss.work('send-check-in-reminder', async (job) => {
            await this.sendCheckInReminder(job.data);
        });
        await this.boss.work('process-missed-check-ins', async () => {
            await this.processMissedCheckIns();
        });
        await this.boss.work('reset-weekly-uploads', async () => {
            await this.resetWeeklyUploads();
        });
        await this.boss.work('process-unlock-requests', async () => {
            await this.processUnlockRequests();
        });
        console.log('✅ All job handlers registered');
    }
    async scheduleRecurringJobs() {
        await this.boss.schedule('process-missed-check-ins', '0 */6 * * *', null, {
            tz: 'UTC'
        });
        await this.boss.schedule('reset-weekly-uploads', '0 0 * * 1', null, {
            tz: 'UTC'
        });
        await this.boss.schedule('process-unlock-requests', '0 */1 * * *', null, {
            tz: 'UTC'
        });
        console.log('✅ Recurring jobs scheduled');
        console.log('  - Check-in processor: Every 6 hours');
        console.log('  - Weekly upload reset: Every Monday at midnight');
        console.log('  - Unlock request processor: Every hour');
    }
    async scheduleCheckInReminder(userId, nextCheckIn) {
        const reminderDate = new Date(nextCheckIn.getTime() - 7 * 24 * 60 * 60 * 1000);
        await this.boss.send('send-check-in-reminder', { userId }, {
            startAfter: reminderDate,
            singletonKey: `check-in-reminder-${userId}`
        });
        console.log(`📅 Scheduled check-in reminder for user ${userId} at ${reminderDate.toISOString()}`);
    }
    async sendCheckInReminder(data) {
        const user = await index_1.prisma.user.findUnique({
            where: { id: data.userId }
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
