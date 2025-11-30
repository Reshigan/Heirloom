import { prisma } from '../db';
import { NotificationService } from './notifications';
import { UnlockService } from './unlock';
import { notificationService } from './NotificationService';
import * as cron from 'node-cron';

export class JobScheduler {
  private tasks: cron.ScheduledTask[] = [];
  private notificationService: NotificationService;
  private unlockService: UnlockService;

  constructor() {
    this.notificationService = new NotificationService();
    this.unlockService = new UnlockService();
  }

  async start() {
    console.log('📅 Starting job scheduler with node-cron...');

    // Schedule missed check-in processor (every 6 hours)
    const missedCheckInsTask = cron.schedule('0 */6 * * *', async () => {
      console.log('⚠️  Running missed check-ins processor...');
      try {
        await this.processMissedCheckIns();
      } catch (error) {
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
      } catch (error) {
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
      } catch (error) {
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

  async scheduleCheckInReminder(userId: string, nextCheckIn: Date) {
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
      } catch (error) {
        console.error(`❌ Error sending check-in reminder to user ${userId}:`, error);
      }
    }, delay);

    console.log(`📅 Scheduled check-in reminder for user ${userId} at ${reminderDate.toISOString()}`);
  }

  private async sendCheckInReminder(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.status !== 'alive') {
      return;
    }

    await this.notificationService.sendCheckInReminder(user.email, user.nextCheckIn!);

    await notificationService.create({
      userId: user.id,
      type: 'check_in_reminder',
      title: 'Time to Check In',
      body: `Please check in to confirm you're okay. Your next check-in is due ${user.nextCheckIn ? new Date(user.nextCheckIn).toLocaleDateString() : 'soon'}.`,
      actionUrl: '/app',
      priority: 1,
      dedupeKey: `check_in_reminder_${user.id}_${new Date().toISOString().split('T')[0]}`,
    });

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
      await notificationService.create({
        userId: user.id,
        type: 'check_in_reminder',
        title: 'Missed Check-In Alert',
        body: 'You missed your scheduled check-in. Please check in as soon as possible to avoid triggering the dead man\'s switch.',
        actionUrl: '/app',
        priority: 2,
      });
      console.log(`⚠️ User ${user.email} missed first check-in`);
    } else if (user.status === 'missed_one' && daysSinceCheckIn > 120) {
      newStatus = 'missed_two';
      await this.notificationService.sendMissedCheckInAlert(user.email, 2);
      await notificationService.create({
        userId: user.id,
        type: 'check_in_reminder',
        title: 'Second Missed Check-In - Urgent',
        body: 'This is your second missed check-in. Your vault will be unlocked if you don\'t check in soon.',
        actionUrl: '/app',
        priority: 3,
      });
      console.log(`⚠️ User ${user.email} missed second check-in`);
    } else if (user.status === 'missed_two' && daysSinceCheckIn > 150) {
      newStatus = 'escalation';
      gracePeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await this.notificationService.sendEscalationAlert(user.email);
      await this.notificationService.notifyTrustedContacts(user.id);
      await notificationService.create({
        userId: user.id,
        type: 'unlock_pending',
        title: 'Dead Man\'s Switch Activated',
        body: 'Your trusted contacts have been notified. Your vault will be unlocked after the grace period.',
        actionUrl: '/app',
        priority: 3,
      });
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

        const vault = await prisma.vault.findUnique({
          where: { id: request.vaultId },
          include: { recipients: true }
        });

        if (vault) {
          for (const recipient of vault.recipients) {
            await notificationService.create({
              userId: recipient.email,
              type: 'unlock_pending',
              title: 'Vault Unlocked',
              body: 'A vault has been unlocked and is now accessible to you. The owner has not checked in as scheduled.',
              actionUrl: '/app',
              priority: 2,
            });
          }
        }

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
