import { PrismaClient, SubscriptionTier } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

export interface ReferralReward {
  type: 'free_month' | 'upgrade' | 'bonus_features' | 'storage_increase';
  value: number;
  description: string;
  expiresAt?: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  currentStreak: number;
  nextRewardAt: number;
  rewardsHistory: ReferralReward[];
}

export class ReferralService {
  private readonly REFERRAL_REWARDS = {
    1: { type: 'bonus_features', value: 7, description: '7 days of premium features' },
    3: { type: 'storage_increase', value: 1000, description: '1GB extra storage' },
    5: { type: 'free_month', value: 1, description: '1 month free subscription' },
    10: { type: 'upgrade', value: 30, description: '30 days premium upgrade' },
    15: { type: 'free_month', value: 2, description: '2 months free subscription' },
    25: { type: 'free_month', value: 3, description: '3 months free subscription' },
    50: { type: 'upgrade', value: 90, description: '90 days premium upgrade' },
  };

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  // Generate unique referral code for user
  async generateReferralCode(userId: string): Promise<string> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true, firstName: true, lastName: true }
      });

      if (user?.referralCode) {
        return user.referralCode;
      }

      // Generate a human-readable referral code
      const firstName = user?.firstName?.toLowerCase() || 'user';
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const referralCode = `${firstName}-${randomSuffix}`;

      await this.prisma.user.update({
        where: { id: userId },
        data: { referralCode }
      });

      return referralCode;
    } catch (error) {
      logger.error('Failed to generate referral code:', error);
      throw new Error('Failed to generate referral code');
    }
  }

  // Process a new user registration with referral code
  async processReferral(newUserId: string, referralCode: string): Promise<{
    success: boolean;
    referrerId?: string;
    reward?: ReferralReward;
  }> {
    try {
      // Find the referrer
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode },
        select: { 
          id: true, 
          firstName: true, 
          lastName: true, 
          referralCount: true,
          subscriptionTier: true,
          subscriptionEndsAt: true
        }
      });

      if (!referrer) {
        return { success: false };
      }

      // Prevent self-referral
      if (referrer.id === newUserId) {
        return { success: false };
      }

      // Update the new user with referrer information
      await this.prisma.user.update({
        where: { id: newUserId },
        data: { referredBy: referrer.id }
      });

      // Increment referrer's count
      const updatedReferrer = await this.prisma.user.update({
        where: { id: referrer.id },
        data: { 
          referralCount: { increment: 1 }
        },
        select: { referralCount: true }
      });

      // Check for rewards
      const reward = await this.checkAndApplyRewards(referrer.id, updatedReferrer.referralCount);

      // Log the referral
      await this.logReferralEvent(referrer.id, newUserId, 'referral_completed', reward);

      // Cache referral stats for quick access
      await this.updateReferralStatsCache(referrer.id);

      return {
        success: true,
        referrerId: referrer.id,
        reward
      };

    } catch (error) {
      logger.error('Failed to process referral:', error);
      return { success: false };
    }
  }

  // Check and apply rewards based on referral count
  private async checkAndApplyRewards(userId: string, referralCount: number): Promise<ReferralReward | undefined> {
    try {
      const rewardConfig = this.REFERRAL_REWARDS[referralCount as keyof typeof this.REFERRAL_REWARDS];
      
      if (!rewardConfig) {
        return undefined;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          subscriptionTier: true, 
          subscriptionEndsAt: true,
          freeMonthsEarned: true
        }
      });

      if (!user) return undefined;

      let updateData: any = {};
      let reward: ReferralReward;

      switch (rewardConfig.type) {
        case 'free_month':
          // Extend subscription by the reward value (months)
          const currentEnd = user.subscriptionEndsAt || new Date();
          const newEndDate = new Date(currentEnd);
          newEndDate.setMonth(newEndDate.getMonth() + rewardConfig.value);
          
          updateData = {
            subscriptionEndsAt: newEndDate,
            freeMonthsEarned: { increment: rewardConfig.value }
          };

          reward = {
            type: 'free_month',
            value: rewardConfig.value,
            description: rewardConfig.description,
            expiresAt: newEndDate
          };
          break;

        case 'upgrade':
          // Temporary upgrade to premium tier
          const upgradeEnd = new Date();
          upgradeEnd.setDate(upgradeEnd.getDate() + rewardConfig.value);
          
          if (user.subscriptionTier === 'FREE') {
            updateData = {
              subscriptionTier: 'PREMIUM',
              subscriptionEndsAt: upgradeEnd
            };
          }

          reward = {
            type: 'upgrade',
            value: rewardConfig.value,
            description: rewardConfig.description,
            expiresAt: upgradeEnd
          };
          break;

        case 'bonus_features':
          // Enable bonus features for specified days
          reward = {
            type: 'bonus_features',
            value: rewardConfig.value,
            description: rewardConfig.description,
            expiresAt: new Date(Date.now() + rewardConfig.value * 24 * 60 * 60 * 1000)
          };
          break;

        case 'storage_increase':
          // Increase storage quota
          reward = {
            type: 'storage_increase',
            value: rewardConfig.value,
            description: rewardConfig.description
          };
          break;

        default:
          return undefined;
      }

      // Apply the reward
      if (Object.keys(updateData).length > 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: updateData
        });
      }

      // Store reward in Redis for quick access
      await this.redis.lpush(
        `user:${userId}:rewards`,
        JSON.stringify({
          ...reward,
          earnedAt: new Date().toISOString(),
          referralCount
        })
      );

      // Keep only last 50 rewards
      await this.redis.ltrim(`user:${userId}:rewards`, 0, 49);

      return reward;

    } catch (error) {
      logger.error('Failed to apply referral reward:', error);
      return undefined;
    }
  }

  // Get referral statistics for a user
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      // Try to get from cache first
      const cached = await this.redis.get(`referral_stats:${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          referralCount: true,
          freeMonthsEarned: true,
          referrals: {
            select: {
              id: true,
              createdAt: true,
              emailVerified: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const successfulReferrals = user.referrals.filter(r => r.emailVerified).length;
      const pendingReferrals = user.referrals.filter(r => !r.emailVerified).length;

      // Get rewards history from Redis
      const rewardsData = await this.redis.lrange(`user:${userId}:rewards`, 0, -1);
      const rewardsHistory = rewardsData.map(data => JSON.parse(data));

      // Calculate next reward threshold
      const nextRewardThresholds = Object.keys(this.REFERRAL_REWARDS)
        .map(Number)
        .filter(threshold => threshold > user.referralCount);
      const nextRewardAt = nextRewardThresholds.length > 0 ? Math.min(...nextRewardThresholds) : 0;

      // Calculate current streak (consecutive months with referrals)
      const currentStreak = await this.calculateReferralStreak(userId);

      const stats: ReferralStats = {
        totalReferrals: user.referralCount,
        successfulReferrals,
        pendingReferrals,
        totalRewardsEarned: user.freeMonthsEarned,
        currentStreak,
        nextRewardAt,
        rewardsHistory: rewardsHistory.slice(0, 10) // Last 10 rewards
      };

      // Cache for 1 hour
      await this.redis.setex(`referral_stats:${userId}`, 3600, JSON.stringify(stats));

      return stats;

    } catch (error) {
      logger.error('Failed to get referral stats:', error);
      throw new Error('Failed to get referral stats');
    }
  }

  // Get referral leaderboard
  async getReferralLeaderboard(limit: number = 10): Promise<Array<{
    userId: string;
    name: string;
    referralCount: number;
    rank: number;
  }>> {
    try {
      const topReferrers = await this.prisma.user.findMany({
        where: {
          referralCount: { gt: 0 }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          referralCount: true
        },
        orderBy: {
          referralCount: 'desc'
        },
        take: limit
      });

      return topReferrers.map((user, index) => ({
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        referralCount: user.referralCount,
        rank: index + 1
      }));

    } catch (error) {
      logger.error('Failed to get referral leaderboard:', error);
      return [];
    }
  }

  // Generate referral link with tracking
  async generateReferralLink(userId: string, campaign?: string): Promise<string> {
    try {
      const referralCode = await this.generateReferralCode(userId);
      const baseUrl = process.env.APP_URL || 'https://heirloom.app';
      
      let referralLink = `${baseUrl}/join?ref=${referralCode}`;
      
      if (campaign) {
        referralLink += `&campaign=${encodeURIComponent(campaign)}`;
      }

      // Track link generation
      await this.logReferralEvent(userId, null, 'link_generated', undefined, { campaign });

      return referralLink;

    } catch (error) {
      logger.error('Failed to generate referral link:', error);
      throw new Error('Failed to generate referral link');
    }
  }

  // Track referral link clicks
  async trackReferralClick(referralCode: string, metadata?: any): Promise<void> {
    try {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode },
        select: { id: true }
      });

      if (referrer) {
        await this.logReferralEvent(referrer.id, null, 'link_clicked', undefined, metadata);
        
        // Increment click counter in Redis
        const key = `referral_clicks:${referrer.id}:${new Date().toISOString().split('T')[0]}`;
        await this.redis.incr(key);
        await this.redis.expire(key, 86400 * 30); // Keep for 30 days
      }

    } catch (error) {
      logger.error('Failed to track referral click:', error);
    }
  }

  // Get referral analytics
  async getReferralAnalytics(userId: string, days: number = 30): Promise<{
    clicks: number;
    conversions: number;
    conversionRate: number;
    recentActivity: Array<{
      date: string;
      clicks: number;
      conversions: number;
    }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get click data from Redis
      const clickPromises = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const key = `referral_clicks:${userId}:${dateStr}`;
        clickPromises.push(this.redis.get(key).then(val => ({ date: dateStr, clicks: parseInt(val || '0') })));
      }

      const clickData = await Promise.all(clickPromises);
      const totalClicks = clickData.reduce((sum, day) => sum + day.clicks, 0);

      // Get conversion data from database
      const conversions = await this.prisma.user.findMany({
        where: {
          referredBy: userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          emailVerified: true
        }
      });

      const totalConversions = conversions.filter(c => c.emailVerified).length;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Group conversions by date
      const conversionsByDate = conversions.reduce((acc, conversion) => {
        const date = conversion.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (conversion.emailVerified ? 1 : 0);
        return acc;
      }, {} as Record<string, number>);

      const recentActivity = clickData.map(day => ({
        date: day.date,
        clicks: day.clicks,
        conversions: conversionsByDate[day.date] || 0
      }));

      return {
        clicks: totalClicks,
        conversions: totalConversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        recentActivity
      };

    } catch (error) {
      logger.error('Failed to get referral analytics:', error);
      throw new Error('Failed to get referral analytics');
    }
  }

  // Private helper methods
  private async calculateReferralStreak(userId: string): Promise<number> {
    try {
      // Get referrals grouped by month
      const referrals = await this.prisma.user.findMany({
        where: { referredBy: userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' }
      });

      if (referrals.length === 0) return 0;

      let streak = 0;
      const now = new Date();
      let currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Check each month backwards
      for (let i = 0; i < 12; i++) { // Max 12 months
        const monthStart = new Date(currentMonth);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const monthReferrals = referrals.filter(r => 
          r.createdAt >= monthStart && r.createdAt <= monthEnd
        );

        if (monthReferrals.length > 0) {
          streak++;
        } else if (streak > 0) {
          break; // Streak broken
        }

        // Move to previous month
        currentMonth.setMonth(currentMonth.getMonth() - 1);
      }

      return streak;

    } catch (error) {
      logger.error('Failed to calculate referral streak:', error);
      return 0;
    }
  }

  private async updateReferralStatsCache(userId: string): Promise<void> {
    try {
      // Invalidate cache to force refresh on next request
      await this.redis.del(`referral_stats:${userId}`);
    } catch (error) {
      logger.error('Failed to update referral stats cache:', error);
    }
  }

  private async logReferralEvent(
    referrerId: string,
    referredUserId: string | null,
    eventType: string,
    reward?: ReferralReward,
    metadata?: any
  ): Promise<void> {
    try {
      const eventData = {
        referrerId,
        referredUserId,
        eventType,
        reward,
        metadata,
        timestamp: new Date().toISOString()
      };

      // Store in Redis for analytics
      await this.redis.lpush(`referral_events:${referrerId}`, JSON.stringify(eventData));
      await this.redis.ltrim(`referral_events:${referrerId}`, 0, 999); // Keep last 1000 events

      // Also store in a global events stream for admin analytics
      await this.redis.lpush('global_referral_events', JSON.stringify(eventData));
      await this.redis.ltrim('global_referral_events', 0, 9999); // Keep last 10000 events

    } catch (error) {
      logger.error('Failed to log referral event:', error);
    }
  }

  // Admin methods for monitoring and management
  async getGlobalReferralStats(): Promise<{
    totalReferrals: number;
    totalRewardsGiven: number;
    topReferrers: Array<{ name: string; count: number }>;
    conversionRate: number;
  }> {
    try {
      const totalUsers = await this.prisma.user.count();
      const referredUsers = await this.prisma.user.count({
        where: { referredBy: { not: null } }
      });

      const totalRewards = await this.prisma.user.aggregate({
        _sum: { freeMonthsEarned: true }
      });

      const topReferrers = await this.getReferralLeaderboard(5);

      return {
        totalReferrals: referredUsers,
        totalRewardsGiven: totalRewards._sum.freeMonthsEarned || 0,
        topReferrers: topReferrers.map(r => ({ name: r.name, count: r.referralCount })),
        conversionRate: totalUsers > 0 ? (referredUsers / totalUsers) * 100 : 0
      };

    } catch (error) {
      logger.error('Failed to get global referral stats:', error);
      throw new Error('Failed to get global referral stats');
    }
  }
}