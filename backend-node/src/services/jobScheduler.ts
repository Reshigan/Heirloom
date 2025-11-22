import PgBoss from 'pg-boss';
import { prisma } from '../index';
import { NotificationService } from './notifications';
import { UnlockService } from './unlock';

export class JobScheduler {
  private boss: any;
  private notificationService: NotificationService;
  private unlockService: UnlockService;

  constructor() {
    this.boss = new (PgBoss as any)({
      connectionString: process.env.DATABASE_URL!,
      schema: 'pgboss'
    });

    this.notificationService = new NotificationService();
    this.unlockService = new UnlockService();
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

  private async registerJobs() {
    await this.boss.work('send-check-in-reminder', async (job: any) => {
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

  private async scheduleRecurringJobs() {
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

  async scheduleCheckInReminder(userId: string, nextCheckIn: Date) {
    const reminderDate = new Date(nextCheckIn.getTime() - 7 * 24 * 60 * 60 * 1000);

    await this.boss.send(
      'send-check-in-reminder',
      { userId },
      {
        startAfter: reminderDate,
        singletonKey: `check-in-reminder-${userId}`
      }
    );

    console.log(`📅 Scheduled check-in reminder for user ${userId} at ${reminderDate.toISOString()}`);
  }

  private async sendCheckInReminder(data: { userId: string }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user || user.status !== 'alive') {
      return;
    }

    await this.notificationService.sendCheckInReminder(user.email, user.nextCheckIn!);

    await prisma.checkIn.create({
      data: {
        userId: user.id,
        sentAt: new Date(),
        sentVia: 'email',
        missed: false
      }
    });

    console.log(`✉️ Sent check-in reminder to ${user.email}`);
  }

  private async processMissedCheckIns() {
    const now = new Date();

    const overdueUsers = await prisma.user.findMany({
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

  private async processUserStatus(user: any) {
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
    } else if (user.status === 'missed_one' && daysSinceCheckIn > 120) {
      newStatus = 'missed_two';
      await this.notificationService.sendMissedCheckInAlert(user.email, 2);
      console.log(`⚠️ User ${user.email} missed second check-in`);
    } else if (user.status === 'missed_two' && daysSinceCheckIn > 150) {
      newStatus = 'escalation';
      gracePeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await this.notificationService.sendEscalationAlert(user.email);
      await this.notificationService.notifyTrustedContacts(user.id);
      console.log(`🚨 User ${user.email} escalated to trusted contacts`);
    }

    if (newStatus !== user.status) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: newStatus,
          gracePeriodEnd
        }
      });

      await prisma.checkIn.updateMany({
        where: {
          userId: user.id,
          respondedAt: null
        },
        data: { missed: true }
      });
    }
  }

  private async resetWeeklyUploads() {
    const result = await prisma.vault.updateMany({
      where: { uploadCountThisWeek: { gt: 0 } },
      data: { uploadCountThisWeek: 0 }
    });

    console.log(`🔄 Reset weekly upload counters for ${result.count} vaults`);
  }

  private async processUnlockRequests() {
    const now = new Date();

    const expiredRequests = await prisma.unlockRequest.findMany({
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

        await prisma.unlockRequest.update({
          where: { id: request.id },
          data: {
            status: 'approved',
            completedAt: now
          }
        });

        console.log(`✅ Vault ${request.vaultId} unlocked after grace period`);
      } else {
        await prisma.unlockRequest.update({
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
