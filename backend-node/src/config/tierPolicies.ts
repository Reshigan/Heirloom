/**
 * Subscription tier policies for notifications and reminders
 * 
 * Each tier has different limits and reminder cadences to encourage engagement
 * while respecting the user's subscription level.
 */

export interface TierPolicy {
  tier: string;
  displayName: string;
  
  storageLimitGB: number;
  weeklyUploadLimit: number;
  monthlyMemoryLimit: number;
  
  inactivityReminderDays: number; // Remind if no posts for X days
  
  usageWarningThreshold: number; // Percentage (0-1) when to warn about approaching limit
  
  features: {
    aiEnhancement: boolean;
    storyReels: boolean;
    memorialPages: boolean;
    prioritySupport: boolean;
  };
}

export const TIER_POLICIES: Record<string, TierPolicy> = {
  starter: {
    tier: 'starter',
    displayName: 'Starter',
    storageLimitGB: 10,
    weeklyUploadLimit: 3,
    monthlyMemoryLimit: 10,
    inactivityReminderDays: 30,
    usageWarningThreshold: 0.8, // Warn at 80%
    features: {
      aiEnhancement: false,
      storyReels: false,
      memorialPages: false,
      prioritySupport: false,
    },
  },
  
  family: {
    tier: 'family',
    displayName: 'Family',
    storageLimitGB: 50,
    weeklyUploadLimit: 10,
    monthlyMemoryLimit: 50,
    inactivityReminderDays: 21,
    usageWarningThreshold: 0.85,
    features: {
      aiEnhancement: true,
      storyReels: true,
      memorialPages: false,
      prioritySupport: false,
    },
  },
  
  unlimited: {
    tier: 'unlimited',
    displayName: 'Unlimited',
    storageLimitGB: 500,
    weeklyUploadLimit: 50,
    monthlyMemoryLimit: 200,
    inactivityReminderDays: 14,
    usageWarningThreshold: 0.9,
    features: {
      aiEnhancement: true,
      storyReels: true,
      memorialPages: true,
      prioritySupport: true,
    },
  },
  
  lifetime: {
    tier: 'lifetime',
    displayName: 'Lifetime',
    storageLimitGB: 1000,
    weeklyUploadLimit: 100,
    monthlyMemoryLimit: 500,
    inactivityReminderDays: 14,
    usageWarningThreshold: 0.95,
    features: {
      aiEnhancement: true,
      storyReels: true,
      memorialPages: true,
      prioritySupport: true,
    },
  },
};

export function getTierPolicy(tier: string): TierPolicy {
  return TIER_POLICIES[tier] || TIER_POLICIES.starter;
}

export function getUpgradeUrl(currentTier: string): string {
  const baseUrl = process.env.FRONTEND_URL || 'https://loom.vantax.co.za';
  return `${baseUrl}/billing?upgrade=true&from=${currentTier}`;
}
