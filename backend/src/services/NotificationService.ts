import { PrismaClient, NotificationType, NotificationPriority } from '@prisma/client';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  deliveryMethod?: string[];
  scheduledFor?: Date;
  isRecurring?: boolean;
  recurringPattern?: string;
  data?: any;
}

export interface ReminderRequest {
  userId: string;
  title: string;
  message: string;
  reminderDate: Date;
  isRecurring?: boolean;
  recurringPattern?: string; // cron-like: "0 9 * * 1" (every Monday at 9 AM)
  type: 'memory_prompt' | 'story_suggestion' | 'family_check_in' | 'legacy_planning' | 'time_capsule';
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;
  private isRunning: boolean = false;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.setupEmailTransporter();
  }

  private setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('Notification service started');
    
    // Start background processes
    this.startNotificationProcessor();
    this.startReminderScheduler();
    this.startLegacyMonitor();
  }

  async stop() {
    this.isRunning = false;
    logger.info('Notification service stopped');
  }

  // Create and send notifications
  async createNotification(request: NotificationRequest): Promise<string> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: request.userId,
          title: request.title,
          message: request.message,
          type: request.type,
          priority: request.priority || 'NORMAL',
          deliveryMethod: request.deliveryMethod || ['app'],
          scheduledFor: request.scheduledFor,
          isRecurring: request.isRecurring || false,
          recurringPattern: request.recurringPattern,
        },
      });

      // If not scheduled, send immediately
      if (!request.scheduledFor || request.scheduledFor <= new Date()) {
        await this.deliverNotification(notification.id);
      } else {
        // Schedule for later delivery
        await this.scheduleNotification(notification.id, request.scheduledFor);
      }

      return notification.id;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Create smart reminders
  async createReminder(request: ReminderRequest): Promise<string> {
    const reminderMessage = this.generateReminderMessage(request.type, request.message);
    
    return this.createNotification({
      userId: request.userId,
      title: request.title,
      message: reminderMessage,
      type: 'MEMORY_REMINDER',
      priority: 'NORMAL',
      deliveryMethod: ['app', 'email'],
      scheduledFor: request.reminderDate,
      isRecurring: request.isRecurring,
      recurringPattern: request.recurringPattern,
    });
  }

  // Smart reminder suggestions based on user behavior
  async createSmartReminders(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          memories: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          families: {
            include: {
              family: {
                include: {
                  memories: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                  },
                },
              },
            },
          },
        },
      });

      if (!user) return;

      const now = new Date();
      const lastMemoryDate = user.memories[0]?.createdAt;
      const daysSinceLastMemory = lastMemoryDate 
        ? Math.floor((now.getTime() - lastMemoryDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30;

      // Memory creation reminders
      if (daysSinceLastMemory > 7) {
        await this.createReminder({
          userId,
          title: '📸 Time to Capture a Memory',
          message: `It's been ${daysSinceLastMemory} days since your last memory. What special moment would you like to preserve today?`,
          reminderDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          type: 'memory_prompt',
        });
      }

      // Weekly family check-in
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + (7 - now.getDay()));
      nextSunday.setHours(19, 0, 0, 0); // 7 PM on Sunday

      await this.createReminder({
        userId,
        title: '👨‍👩‍👧‍👦 Weekly Family Check-in',
        message: 'How was your week? Consider sharing a highlight or creating a family memory together.',
        reminderDate: nextSunday,
        isRecurring: true,
        recurringPattern: '0 19 * * 0', // Every Sunday at 7 PM
        type: 'family_check_in',
      });

      // Monthly legacy planning reminder
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(10, 0, 0, 0);

      await this.createReminder({
        userId,
        title: '🏛️ Legacy Planning Check',
        message: 'Take a moment to review and update your legacy plans. Your future family will thank you.',
        reminderDate: nextMonth,
        isRecurring: true,
        recurringPattern: '0 10 1 * *', // First day of every month at 10 AM
        type: 'legacy_planning',
      });

      // Birthday and anniversary reminders
      await this.createBirthdayReminders(userId);
      
    } catch (error) {
      logger.error('Failed to create smart reminders:', error);
    }
  }

  // Send real-time notifications via WebSocket
  async sendRealTimeNotification(userId: string, notification: any): Promise<void> {
    try {
      // Publish to Redis for WebSocket distribution
      await this.redis.publish(`notifications:${userId}`, JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      logger.error('Failed to send real-time notification:', error);
    }
  }

  // Family milestone notifications
  async notifyFamilyMilestone(familyId: string, milestone: {
    type: 'new_member' | 'anniversary' | 'achievement' | 'memory_milestone';
    title: string;
    message: string;
    celebratedUserId?: string;
  }): Promise<void> {
    try {
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!family) return;

      // Notify all family members
      for (const member of family.members) {
        if (member.userId === milestone.celebratedUserId) continue; // Don't notify the person being celebrated

        await this.createNotification({
          userId: member.userId,
          title: `🎉 ${family.name} - ${milestone.title}`,
          message: milestone.message,
          type: 'FAMILY_INVITE', // Using closest available type
          priority: 'HIGH',
          deliveryMethod: ['app', 'email'],
        });
      }
    } catch (error) {
      logger.error('Failed to notify family milestone:', error);
    }
  }

  // AI story completion notifications
  async notifyStoryGenerated(userId: string, storyId: string, storyTitle: string): Promise<void> {
    await this.createNotification({
      userId,
      title: '✨ Your AI Story is Ready!',
      message: `"${storyTitle}" has been generated from your family memories. Take a look and share it with your family!`,
      type: 'STORY_GENERATED',
      priority: 'HIGH',
      deliveryMethod: ['app', 'email'],
      data: { storyId },
    });
  }

  // Time capsule delivery notifications
  async notifyTimeCapsuleReady(timeCapsuleId: string): Promise<void> {
    try {
      const timeCapsule = await this.prisma.timeCapsule.findUnique({
        where: { id: timeCapsuleId },
        include: {
          creator: true,
          family: true,
        },
      });

      if (!timeCapsule || timeCapsule.isDelivered) return;

      // Notify recipients
      for (const recipient of timeCapsule.recipients) {
        // Check if recipient is a user ID or email
        const isUserId = recipient.length === 25; // CUID length
        
        if (isUserId) {
          await this.createNotification({
            userId: recipient,
            title: '📮 Time Capsule Delivered!',
            message: `A time capsule from ${timeCapsule.creator.firstName} ${timeCapsule.creator.lastName} has arrived: "${timeCapsule.title}"`,
            type: 'TIME_CAPSULE_READY',
            priority: 'HIGH',
            deliveryMethod: ['app', 'email'],
            data: { timeCapsuleId },
          });
        } else {
          // Send email to external recipient
          await this.sendTimeCapsuleEmail(recipient, timeCapsule);
        }
      }

      // Mark as delivered
      await this.prisma.timeCapsule.update({
        where: { id: timeCapsuleId },
        data: {
          isDelivered: true,
          deliveredAt: new Date(),
        },
      });

    } catch (error) {
      logger.error('Failed to notify time capsule ready:', error);
    }
  }

  // Referral reward notifications
  async notifyReferralReward(userId: string, referralCount: number, reward: string): Promise<void> {
    await this.createNotification({
      userId,
      title: '🎁 Referral Reward Earned!',
      message: `Congratulations! You've referred ${referralCount} friends and earned: ${reward}`,
      type: 'REFERRAL_REWARD',
      priority: 'HIGH',
      deliveryMethod: ['app', 'email'],
    });
  }

  // Subscription expiration warnings
  async notifySubscriptionExpiring(userId: string, daysUntilExpiration: number): Promise<void> {
    const urgency = daysUntilExpiration <= 3 ? 'URGENT' : daysUntilExpiration <= 7 ? 'HIGH' : 'NORMAL';
    
    await this.createNotification({
      userId,
      title: '⚠️ Subscription Expiring Soon',
      message: `Your Loominary subscription expires in ${daysUntilExpiration} days. Renew now to keep preserving your family's legacy.`,
      type: 'SUBSCRIPTION_EXPIRING',
      priority: urgency as NotificationPriority,
      deliveryMethod: ['app', 'email'],
    });
  }

  // Private methods for background processing
  private async deliverNotification(notificationId: string): Promise<void> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          user: true,
        },
      });

      if (!notification) return;

      // Send via app (real-time)
      if (notification.deliveryMethod.includes('app')) {
        await this.sendRealTimeNotification(notification.userId, {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          createdAt: notification.createdAt,
        });
      }

      // Send via email
      if (notification.deliveryMethod.includes('email')) {
        await this.sendEmailNotification(notification.user.email, {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          userName: `${notification.user.firstName} ${notification.user.lastName}`,
        });
      }

      // TODO: Send push notifications when mobile apps are implemented

    } catch (error) {
      logger.error('Failed to deliver notification:', error);
    }
  }

  private async sendEmailNotification(email: string, notification: {
    title: string;
    message: string;
    type: string;
    userName: string;
  }): Promise<void> {
    try {
      const emailTemplate = this.generateEmailTemplate(notification);
      
      await this.emailTransporter.sendMail({
        from: `"Loominary" <${config.email.from}>`,
        to: email,
        subject: notification.title,
        html: emailTemplate,
      });

    } catch (error) {
      logger.error('Failed to send email notification:', error);
    }
  }

  private async sendTimeCapsuleEmail(email: string, timeCapsule: any): Promise<void> {
    try {
      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0ea5e9;">📮 Time Capsule Delivered!</h1>
          <p>Hello!</p>
          <p>You've received a special time capsule from <strong>${timeCapsule.creator.firstName} ${timeCapsule.creator.lastName}</strong>:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">${timeCapsule.title}</h2>
            <p style="color: #4b5563;">${timeCapsule.message}</p>
          </div>
          <p>This message was created on ${timeCapsule.createdAt.toLocaleDateString()} to be delivered today.</p>
          <p>Visit <a href="${config.app.url}" style="color: #0ea5e9;">Loominary</a> to create your own time capsules and preserve your family's legacy.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This time capsule was sent through Loominary - The world's first legacy platform for future generations.
          </p>
        </div>
      `;

      await this.emailTransporter.sendMail({
        from: `"Loominary Time Capsule" <${config.email.from}>`,
        to: email,
        subject: `📮 Time Capsule: ${timeCapsule.title}`,
        html: emailTemplate,
      });

    } catch (error) {
      logger.error('Failed to send time capsule email:', error);
    }
  }

  private generateEmailTemplate(notification: {
    title: string;
    message: string;
    type: string;
    userName: string;
  }): string {
    const typeEmojis = {
      MEMORY_REMINDER: '📸',
      FAMILY_INVITE: '👨‍👩‍👧‍👦',
      STORY_GENERATED: '✨',
      TIME_CAPSULE_READY: '📮',
      SUBSCRIPTION_EXPIRING: '⚠️',
      REFERRAL_REWARD: '🎁',
      SYSTEM_UPDATE: '🔔',
      LEGACY_REMINDER: '🏛️',
    };

    const emoji = typeEmojis[notification.type as keyof typeof typeEmojis] || '🔔';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${emoji} Loominary</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Preserving Legacy for Future Generations</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">${notification.title}</h2>
          <p style="color: #4b5563; line-height: 1.6;">${notification.message}</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.app.url}" style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Open Loominary
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Best regards,<br>
            The Loominary Team
          </p>
        </div>
      </div>
    `;
  }

  private generateReminderMessage(type: string, baseMessage: string): string {
    const suggestions = {
      memory_prompt: [
        "What made you smile today?",
        "Share a photo from this week's adventures",
        "Tell us about a conversation that meant something to you",
        "Capture a moment with family or friends",
        "What's something you're grateful for right now?"
      ],
      story_suggestion: [
        "Turn your recent memories into a beautiful story",
        "Let AI help you weave your experiences into a narrative",
        "Create a story that future generations will treasure",
        "Transform your photos into a compelling family tale"
      ],
      family_check_in: [
        "How is everyone doing this week?",
        "Share what's been happening in your lives",
        "Any special moments to celebrate together?",
        "What are you looking forward to as a family?"
      ],
      legacy_planning: [
        "Review your digital legacy settings",
        "Update your family's important information",
        "Consider creating a time capsule for the future",
        "Add to your family's story archive"
      ],
      time_capsule: [
        "What would you want to tell your future family?",
        "Create a message for next year's you",
        "Capture this moment in time for future generations",
        "Share your hopes and dreams with tomorrow's family"
      ]
    };

    const typeSuggestions = suggestions[type as keyof typeof suggestions] || [];
    const randomSuggestion = typeSuggestions[Math.floor(Math.random() * typeSuggestions.length)];
    
    return baseMessage + (randomSuggestion ? `\n\n💡 Suggestion: ${randomSuggestion}` : '');
  }

  private async scheduleNotification(notificationId: string, scheduledFor: Date): Promise<void> {
    const delay = scheduledFor.getTime() - Date.now();
    
    if (delay > 0) {
      // Use Redis for scheduling
      await this.redis.zadd('scheduled_notifications', scheduledFor.getTime(), notificationId);
    }
  }

  private startNotificationProcessor(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const now = Date.now();
        const dueNotifications = await this.redis.zrangebyscore('scheduled_notifications', 0, now);
        
        for (const notificationId of dueNotifications) {
          await this.deliverNotification(notificationId);
          await this.redis.zrem('scheduled_notifications', notificationId);
        }
      } catch (error) {
        logger.error('Notification processor error:', error);
      }
    }, 60000); // Check every minute
  }

  private startReminderScheduler(): void {
    // Check for recurring reminders every hour
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const recurringNotifications = await this.prisma.notification.findMany({
          where: {
            isRecurring: true,
            recurringPattern: { not: null },
          },
        });

        for (const notification of recurringNotifications) {
          // TODO: Implement cron pattern matching for recurring notifications
          // This would check if it's time to create the next instance
        }
      } catch (error) {
        logger.error('Reminder scheduler error:', error);
      }
    }, 3600000); // Check every hour
  }

  private startLegacyMonitor(): void {
    // Monitor for legacy plan triggers
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Check for inactive users who have legacy plans
        const inactiveThreshold = new Date();
        inactiveThreshold.setDate(inactiveThreshold.getDate() - 30); // 30 days

        const inactiveUsers = await this.prisma.user.findMany({
          where: {
            lastActiveAt: { lt: inactiveThreshold },
            legacyPlans: {
              some: {
                isActive: true,
                activationTrigger: 'inactivity',
              },
            },
          },
          include: {
            legacyPlans: true,
          },
        });

        for (const user of inactiveUsers) {
          for (const plan of user.legacyPlans) {
            if (plan.activationTrigger === 'inactivity' && plan.inactivityDays) {
              const daysSinceActive = Math.floor(
                (Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (daysSinceActive >= plan.inactivityDays) {
                // Trigger legacy plan execution
                await this.triggerLegacyPlan(plan.id);
              }
            }
          }
        }
      } catch (error) {
        logger.error('Legacy monitor error:', error);
      }
    }, 86400000); // Check daily
  }

  private async triggerLegacyPlan(legacyPlanId: string): Promise<void> {
    try {
      const plan = await this.prisma.legacyPlan.findUnique({
        where: { id: legacyPlanId },
        include: { owner: true },
      });

      if (!plan || plan.isExecuted) return;

      // Mark as executed
      await this.prisma.legacyPlan.update({
        where: { id: legacyPlanId },
        data: {
          isExecuted: true,
          executedAt: new Date(),
        },
      });

      // TODO: Implement actual legacy plan execution
      // This would involve notifying designated contacts, transferring digital assets, etc.
      
      logger.info(`Legacy plan executed for user ${plan.ownerId}: ${plan.title}`);
      
    } catch (error) {
      logger.error('Failed to trigger legacy plan:', error);
    }
  }

  private async createBirthdayReminders(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          families: {
            include: {
              family: {
                include: {
                  members: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          dateOfBirth: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) return;

      const now = new Date();
      const currentYear = now.getFullYear();

      // Get all family members with birthdays
      const familyMembers = user.families.flatMap(fm => fm.family.members)
        .filter(member => member.user.dateOfBirth && member.user.id !== userId);

      for (const member of familyMembers) {
        if (!member.user.dateOfBirth) continue;

        const birthday = new Date(member.user.dateOfBirth);
        const thisYearBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
        
        // If birthday has passed this year, schedule for next year
        if (thisYearBirthday < now) {
          thisYearBirthday.setFullYear(currentYear + 1);
        }

        // Schedule reminder 3 days before birthday
        const reminderDate = new Date(thisYearBirthday);
        reminderDate.setDate(reminderDate.getDate() - 3);
        reminderDate.setHours(9, 0, 0, 0); // 9 AM

        await this.createReminder({
          userId,
          title: `🎂 ${member.user.firstName}'s Birthday Coming Up`,
          message: `${member.user.firstName} ${member.user.lastName}'s birthday is in 3 days! Consider creating a special memory or planning a celebration.`,
          reminderDate,
          isRecurring: true,
          recurringPattern: '0 9 * * *', // Daily at 9 AM (will be filtered by date logic)
          type: 'family_check_in',
        });
      }
    } catch (error) {
      logger.error('Failed to create birthday reminders:', error);
    }
  }
}