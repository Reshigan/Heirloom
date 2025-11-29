/**
 * Sentiment-driven notification service
 * Generates motivational notifications based on user's sentiment patterns
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SentimentStats {
  totalMemories: number;
  sentimentBreakdown: { [key: string]: number };
  emotionBreakdown: { [key: string]: number };
  recentSentiment: string | null;
  daysSinceLastPost: number;
}

export class SentimentNotificationService {
  /**
   * Get sentiment statistics for a user
   */
  async getSentimentStats(userId: string): Promise<SentimentStats> {
    const vault = await prisma.vault.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    if (!vault) {
      throw new Error('Vault not found');
    }

    const sentimentBreakdown: { [key: string]: number } = {};
    const emotionBreakdown: { [key: string]: number } = {};
    let mostRecentDate: Date | null = null;
    let recentSentiment: string | null = null;

    for (const item of vault.items) {
      if (item.sentimentLabel) {
        sentimentBreakdown[item.sentimentLabel] = (sentimentBreakdown[item.sentimentLabel] || 0) + 1;
      }

      if (item.emotionCategory) {
        emotionBreakdown[item.emotionCategory] = (emotionBreakdown[item.emotionCategory] || 0) + 1;
      }

      const itemDate = new Date(item.createdAt);
      if (!mostRecentDate || itemDate > mostRecentDate) {
        mostRecentDate = itemDate;
        recentSentiment = item.sentimentLabel || null;
      }
    }

    let daysSinceLastPost = 999;
    if (mostRecentDate) {
      daysSinceLastPost = Math.floor((Date.now() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      totalMemories: vault.items.length,
      sentimentBreakdown,
      emotionBreakdown,
      recentSentiment,
      daysSinceLastPost
    };
  }

  /**
   * Generate sentiment-driven notification message
   */
  generateNotificationMessage(stats: SentimentStats): string | null {
    const { daysSinceLastPost, recentSentiment, totalMemories, sentimentBreakdown } = stats;

    if (totalMemories === 0) {
      return "Start your legacy today. Capture your first memory and begin building something eternal.";
    }

    if (daysSinceLastPost <= 3) {
      return null;
    }

    const topSentiment = Object.entries(sentimentBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    if (daysSinceLastPost <= 7) {
      if (topSentiment === 'joyful' || topSentiment === 'hopeful') {
        return "Share what made you smile today. Your joyful moments deserve to be remembered.";
      } else if (topSentiment === 'nostalgic') {
        return "What cherished moment are you remembering today? Add it to your legacy.";
      } else if (topSentiment === 'loving') {
        return "Capture another loving moment for your family. Every memory matters.";
      }
      return "Your legacy is waiting for the next chapter. What will you add today?";
    }

    if (daysSinceLastPost <= 14) {
      if (topSentiment === 'joyful') {
        return `It's been ${daysSinceLastPost} days since you captured a joyful moment. Share what made you smile today.`;
      } else if (topSentiment === 'nostalgic') {
        return `It's been ${daysSinceLastPost} days. What cherished memory from the past are you thinking about?`;
      } else if (topSentiment === 'loving') {
        return `It's been ${daysSinceLastPost} days. Capture another loving moment for your family to treasure.`;
      }
      return `It's been ${daysSinceLastPost} days. Your memories are waiting for you.`;
    }

    if (daysSinceLastPost <= 30) {
      return `Your legacy misses you. It's been ${daysSinceLastPost} days since your last post. Come back and add to your story.`;
    }

    return `Don't let your memories fade. It's been ${daysSinceLastPost} days. Your family's legacy needs you.`;
  }

  /**
   * Get notification title based on sentiment
   */
  getNotificationTitle(stats: SentimentStats): string {
    const { daysSinceLastPost } = stats;

    if (daysSinceLastPost <= 7) {
      return "Time to add another memory";
    } else if (daysSinceLastPost <= 14) {
      return "Your legacy is waiting";
    } else if (daysSinceLastPost <= 30) {
      return "We miss you!";
    } else {
      return "Your memories need you";
    }
  }

  /**
   * Check if user should receive a notification
   */
  async shouldSendNotification(userId: string): Promise<boolean> {
    const stats = await this.getSentimentStats(userId);
    
    if (stats.daysSinceLastPost <= 3) {
      return false;
    }

    const lastNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'sentiment_reminder'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (lastNotification) {
      const daysSinceLastNotification = Math.floor(
        (Date.now() - lastNotification.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastNotification < 3) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create sentiment-driven notification for user
   */
  async createSentimentNotification(userId: string): Promise<void> {
    const shouldSend = await this.shouldSendNotification(userId);
    if (!shouldSend) {
      return;
    }

    const stats = await this.getSentimentStats(userId);
    const message = this.generateNotificationMessage(stats);
    
    if (!message) {
      return;
    }

    const title = this.getNotificationTitle(stats);

    await prisma.notification.create({
      data: {
        userId,
        type: 'sentiment_reminder',
        title,
        body: message,
        priority: 0,
        dedupeKey: `sentiment_reminder_${userId}_${new Date().toISOString().split('T')[0]}`
      }
    });

    console.log(`Created sentiment notification for user ${userId}: ${title}`);
  }

  /**
   * Process sentiment notifications for all active users
   */
  async processSentimentNotifications(): Promise<void> {
    const users = await prisma.user.findMany({
      where: {
        status: 'alive'
      }
    });

    console.log(`Processing sentiment notifications for ${users.length} users...`);

    for (const user of users) {
      try {
        await this.createSentimentNotification(user.id);
      } catch (error) {
        console.error(`Failed to create sentiment notification for user ${user.id}:`, error);
      }
    }

    console.log('Sentiment notification processing complete');
  }
}

export const sentimentNotificationService = new SentimentNotificationService();
