import { prisma } from '../db';
import { notificationService } from './NotificationService';
import { getTierPolicy, getUpgradeUrl } from '../config/tierPolicies';
import { Resend } from 'resend';

export class ReminderService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || 'test-key');
  }

  /**
   * Process posting reminders for all users based on their tier's inactivity threshold
   */
  async processPostingReminders() {
    console.log('📝 Processing posting reminders...');

    const users = await prisma.user.findMany({
      include: {
        vault: {
          include: {
            items: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    let remindersSent = 0;

    for (const user of users) {
      try {
        const settings = (user as any).notificationSettings || {};
        
        if (settings.story_prompts === false && settings.daily_reminders === false) {
          continue;
        }

        if (!user.vault) continue;

        const policy = getTierPolicy(user.vault.tier);
        const lastMemory = user.vault.items[0];
        
        const daysSinceLastPost = lastMemory
          ? Math.floor((Date.now() - lastMemory.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceLastPost >= policy.inactivityReminderDays) {
          const dedupeKey = `posting_reminder_${user.id}_${new Date().toISOString().split('T')[0]}`;
          
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              dedupeKey,
            },
          });

          if (existingNotification) {
            continue; // Already sent today
          }

          await notificationService.create({
            userId: user.id,
            type: 'story_prompt',
            title: 'Time to Share a Memory',
            body: `It's been ${daysSinceLastPost} days since your last post. Your memories are precious—capture one today!`,
            actionUrl: '/app',
            priority: 1,
            dedupeKey,
          });

          if (settings.email_notifications !== false) {
            await this.sendPostingReminderEmail(
              user.email,
              daysSinceLastPost,
              policy.displayName
            );
          }

          remindersSent++;
          console.log(`✉️ Sent posting reminder to ${user.email} (${daysSinceLastPost} days inactive)`);
        }
      } catch (error) {
        console.error(`❌ Error processing posting reminder for user ${user.id}:`, error);
      }
    }

    console.log(`✅ Sent ${remindersSent} posting reminders`);
    return remindersSent;
  }

  /**
   * Process usage limit notifications for all users
   */
  async processUsageLimitNotifications() {
    console.log('📊 Processing usage limit notifications...');

    const users = await prisma.user.findMany({
      include: {
        vault: {
          include: {
            items: true,
          },
        },
      },
    });

    let notificationsSent = 0;

    for (const user of users) {
      try {
        if (!user.vault) continue;

        const policy = getTierPolicy(user.vault.tier);
        
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyMemories = user.vault.items.filter(
          (item) => item.createdAt >= startOfMonth
        ).length;

        const usagePercentage = monthlyMemories / policy.monthlyMemoryLimit;

        if (
          usagePercentage >= policy.usageWarningThreshold &&
          usagePercentage < 1.0
        ) {
          const dedupeKey = `usage_warning_${user.id}_${new Date().toISOString().split('T')[0]}`;
          
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              dedupeKey,
            },
          });

          if (!existingNotification) {
            await notificationService.create({
              userId: user.id,
              type: 'usage_limit_warning',
              title: 'Approaching Monthly Limit',
              body: `You've used ${monthlyMemories} of ${policy.monthlyMemoryLimit} memories this month. Consider upgrading for more capacity!`,
              actionUrl: getUpgradeUrl(user.vault.tier),
              priority: 1,
              dedupeKey,
            });

            const settings = (user as any).notificationSettings || {};
            if (settings.email_notifications !== false) {
              await this.sendUsageWarningEmail(
                user.email,
                monthlyMemories,
                policy.monthlyMemoryLimit,
                policy.displayName,
                user.vault.tier
              );
            }

            notificationsSent++;
            console.log(`⚠️ Sent usage warning to ${user.email} (${monthlyMemories}/${policy.monthlyMemoryLimit})`);
          }
        }

        if (usagePercentage >= 1.0) {
          const dedupeKey = `usage_limit_reached_${user.id}_${new Date().toISOString().split('T')[0]}`;
          
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              dedupeKey,
            },
          });

          if (!existingNotification) {
            await notificationService.create({
              userId: user.id,
              type: 'usage_limit_reached',
              title: 'Monthly Limit Reached',
              body: `You've reached your ${policy.displayName} plan limit of ${policy.monthlyMemoryLimit} memories this month. Upgrade to continue adding memories!`,
              actionUrl: getUpgradeUrl(user.vault.tier),
              priority: 2,
              dedupeKey,
            });

            const settings = (user as any).notificationSettings || {};
            if (settings.email_notifications !== false) {
              await this.sendUsageLimitReachedEmail(
                user.email,
                policy.monthlyMemoryLimit,
                policy.displayName,
                user.vault.tier
              );
            }

            notificationsSent++;
            console.log(`🚫 Sent limit reached notification to ${user.email}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing usage notification for user ${user.id}:`, error);
      }
    }

    console.log(`✅ Sent ${notificationsSent} usage notifications`);
    return notificationsSent;
  }

  /**
   * Send posting reminder email
   */
  private async sendPostingReminderEmail(
    email: string,
    daysSinceLastPost: number,
    tierName: string
  ) {
    const uploadUrl = `${process.env.FRONTEND_URL}/app`;

    try {
      await this.resend.emails.send({
        from: 'Constellation Vault <noreply@loom.vantax.co.za>',
        to: email,
        subject: '✨ Time to Share a Memory',
        html: `
          <div style="font-family: 'Bodoni Moda', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: #f5f5dc;">
            <h1 style="color: #d4af37; font-size: 32px; margin-bottom: 20px;">✨ Your Memories Await</h1>
            
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
              It's been <strong style="color: #d4af37;">${daysSinceLastPost} days</strong> since you last added a memory to your Constellation Vault.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Every moment is precious. Whether it's a photo, a story, or a simple thought—your memories deserve to be preserved for those you love.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${uploadUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Add a Memory
              </a>
            </div>

            <div style="background: rgba(212, 175, 55, 0.1); border-left: 3px solid #d4af37; padding: 20px; margin: 30px 0;">
              <p style="font-size: 14px; line-height: 1.6; margin: 0;">
                <strong>💡 Story Prompt:</strong> What made you smile today? What lesson did you learn this week? Who do you want to remember this moment?
              </p>
            </div>

            <p style="font-size: 14px; color: #b8b8b8; margin-top: 40px;">
              You're on the <strong>${tierName}</strong> plan. Your memories are stars in the constellation of your legacy.
            </p>

            <p style="font-size: 12px; color: #888; margin-top: 20px;">
              Don't want these reminders? <a href="${process.env.FRONTEND_URL}/app/settings" style="color: #d4af37;">Update your preferences</a>
            </p>
          </div>
        `,
      });

      console.log(`✉️ Posting reminder email sent to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send posting reminder email to ${email}:`, error);
    }
  }

  /**
   * Send usage warning email
   */
  private async sendUsageWarningEmail(
    email: string,
    used: number,
    limit: number,
    tierName: string,
    currentTier: string
  ) {
    const upgradeUrl = getUpgradeUrl(currentTier);
    const percentage = Math.round((used / limit) * 100);

    try {
      await this.resend.emails.send({
        from: 'Constellation Vault <noreply@loom.vantax.co.za>',
        to: email,
        subject: `⚠️ Approaching Your ${tierName} Plan Limit`,
        html: `
          <div style="font-family: 'Bodoni Moda', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: #f5f5dc;">
            <h1 style="color: #ffa500; font-size: 32px; margin-bottom: 20px;">⚠️ Approaching Your Limit</h1>
            
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
              You've used <strong style="color: #ffa500;">${used} of ${limit}</strong> memories this month (${percentage}%).
            </p>

            <div style="background: rgba(255, 165, 0, 0.1); border-radius: 8px; padding: 20px; margin: 30px 0;">
              <div style="background: rgba(255, 165, 0, 0.2); height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #ffa500, #ff8c00); height: 100%; width: ${percentage}%;"></div>
              </div>
            </div>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Don't let your memories wait! Upgrade to a higher tier for more capacity and unlock premium features.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${upgradeUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Upgrade Your Plan
              </a>
            </div>

            <p style="font-size: 14px; color: #b8b8b8; line-height: 1.6; margin-top: 40px;">
              Your ${tierName} plan resets on the 1st of each month. Upgrade anytime to get more capacity immediately!
            </p>
          </div>
        `,
      });

      console.log(`✉️ Usage warning email sent to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send usage warning email to ${email}:`, error);
    }
  }

  /**
   * Send usage limit reached email
   */
  private async sendUsageLimitReachedEmail(
    email: string,
    limit: number,
    tierName: string,
    currentTier: string
  ) {
    const upgradeUrl = getUpgradeUrl(currentTier);

    try {
      await this.resend.emails.send({
        from: 'Constellation Vault <noreply@loom.vantax.co.za>',
        to: email,
        subject: `🚫 Monthly Limit Reached - ${tierName} Plan`,
        html: `
          <div style="font-family: 'Bodoni Moda', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #1a0a0a 0%, #2a1a1e 100%); color: #f5f5dc;">
            <h1 style="color: #ff6b6b; font-size: 32px; margin-bottom: 20px;">🚫 Monthly Limit Reached</h1>
            
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
              You've reached your <strong style="color: #ff6b6b;">${tierName} plan limit of ${limit} memories</strong> for this month.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Your memories are too important to wait. Upgrade now to continue preserving your legacy without limits!
            </p>

            <div style="background: rgba(212, 175, 55, 0.1); border: 2px solid #d4af37; border-radius: 12px; padding: 30px; margin: 30px 0;">
              <h2 style="color: #d4af37; font-size: 24px; margin-bottom: 15px;">✨ Upgrade Benefits</h2>
              <ul style="font-size: 16px; line-height: 2; margin: 0; padding-left: 20px;">
                <li>More monthly memories</li>
                <li>Increased storage capacity</li>
                <li>AI-powered enhancements</li>
                <li>Story reels & memorial pages</li>
                <li>Priority support</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${upgradeUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Upgrade Now
              </a>
            </div>

            <p style="font-size: 14px; color: #b8b8b8; line-height: 1.6; margin-top: 40px;">
              Your limit will reset on the 1st of next month, or upgrade now for immediate access!
            </p>
          </div>
        `,
      });

      console.log(`✉️ Usage limit reached email sent to ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send usage limit email to ${email}:`, error);
    }
  }
}

export const reminderService = new ReminderService();
