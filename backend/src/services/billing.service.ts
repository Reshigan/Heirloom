import Stripe from 'stripe';
import { env, PRICING, TIER_LIMITS } from '../config/env';
import prisma from '../config/database';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { emailService } from './email.service';
import { cache } from '../config/redis';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Currency conversion rates (in production, fetch from API like Open Exchange Rates)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  ZAR: 18.5,
  AUD: 1.53,
  CAD: 1.36,
  INR: 83.12,
  JPY: 149.50,
  CNY: 7.24,
  BRL: 4.97,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  ZAR: 'R',
  AUD: 'A$',
  CAD: 'C$',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  BRL: 'R$',
};

export interface PriceInCurrency {
  amount: number;
  currency: string;
  symbol: string;
  formatted: string;
}

export const billingService = {
  /**
   * Convert USD cents to user's currency
   */
  convertCurrency(usdCents: number, targetCurrency: string): PriceInCurrency {
    const currency = targetCurrency.toUpperCase();
    const rate = EXCHANGE_RATES[currency] || 1;
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    const amount = Math.round((usdCents / 100) * rate * 100) / 100;
    const formatted = `${symbol}${amount.toFixed(2)}`;
    
    return { amount, currency, symbol, formatted };
  },

  /**
   * Get all pricing in user's currency
   */
  getPricingInCurrency(currency: string) {
    return {
      essential: {
        monthly: this.convertCurrency(PRICING.ESSENTIAL.monthly, currency),
        yearly: this.convertCurrency(PRICING.ESSENTIAL.yearly, currency),
      },
      family: {
        monthly: this.convertCurrency(PRICING.FAMILY.monthly, currency),
        yearly: this.convertCurrency(PRICING.FAMILY.yearly, currency),
      },
      legacy: {
        yearly: this.convertCurrency(PRICING.LEGACY.yearly, currency),
      },
    };
  },

  /**
   * Create or get Stripe customer with currency preference
   */
  async getOrCreateCustomer(userId: string, email: string, name: string, currency?: string): Promise<string> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (subscription?.stripeCustomerId) {
      if (currency) {
        await stripe.customers.update(subscription.stripeCustomerId, {
          metadata: { preferredCurrency: currency },
        });
      }
      return subscription.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { 
        userId,
        preferredCurrency: currency || 'USD',
      },
    });

    await prisma.subscription.update({
      where: { userId },
      data: { stripeCustomerId: customer.id },
    });

    logger.info(`Created Stripe customer for user ${userId}: ${customer.id}`);
    return customer.id;
  },

  /**
   * Start 14-day free trial
   */
  async startFreeTrial(userId: string): Promise<void> {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await prisma.subscription.update({
      where: { userId },
      data: {
        tier: 'FREE',
        status: 'TRIALING',
        trialEndsAt: trialEnd,
      },
    });

    await this.scheduleTrialNotifications(userId, trialEnd);
    logger.info(`Started 14-day free trial for user ${userId}`);
  },

  /**
   * Schedule trial expiration notifications
   */
  async scheduleTrialNotifications(userId: string, trialEnd: Date): Promise<void> {
    const notifications = [
      { days: 7, key: `trial:notify:7:${userId}` },
      { days: 3, key: `trial:notify:3:${userId}` },
      { days: 1, key: `trial:notify:1:${userId}` },
    ];

    for (const { days, key } of notifications) {
      const notifyDate = new Date(trialEnd);
      notifyDate.setDate(notifyDate.getDate() - days);
      const ttl = Math.max(0, Math.floor((notifyDate.getTime() - Date.now()) / 1000));
      
      if (ttl > 0) {
        await cache.set(key, { userId, daysLeft: days }, ttl);
      }
    }
  },

  /**
   * Check and process trial expirations (run via cron job)
   */
  async processTrialExpirations(): Promise<void> {
    const expiredTrials = await prisma.subscription.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: { lte: new Date() },
      },
      include: { user: true },
    });

    for (const subscription of expiredTrials) {
      await this.expireTrial(subscription.userId);
    }

    logger.info(`Processed ${expiredTrials.length} expired trials`);
  },

  /**
   * Send trial expiration warning
   */
  async sendTrialWarning(userId: string, daysLeft: number): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await emailService.sendTrialWarning(user.email, user.firstName, daysLeft);
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'TRIAL_WARNING',
        title: `Trial expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
        message: `Upgrade now to keep your memories safe. Your content will be deleted when the trial ends.`,
      },
    });
  },

  /**
   * Expire trial and delete content
   */
  async expireTrial(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user || user.subscription?.status !== 'TRIALING') return;

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
        tier: 'FREE',
      },
    });

    await this.deleteUserContent(userId);
    await emailService.sendTrialExpired(user.email, user.firstName);

    await prisma.notification.create({
      data: {
        userId,
        type: 'TRIAL_EXPIRED',
        title: 'Your trial has ended',
        message: 'Your free trial has expired and your content has been removed. Upgrade anytime to start preserving your memories again.',
      },
    });

    logger.info(`Trial expired for user ${userId}, content deleted`);
  },

  /**
   * Delete all user content (for trial expiration)
   */
  async deleteUserContent(userId: string): Promise<void> {
    const { storageService } = await import('./storage.service');

    const memories = await prisma.memory.findMany({
      where: { userId },
      select: { fileKey: true },
    });

    const voiceRecordings = await prisma.voiceRecording.findMany({
      where: { userId },
      select: { fileKey: true },
    });

    const keysToDelete = [
      ...memories.filter(m => m.fileKey).map(m => m.fileKey!),
      ...voiceRecordings.map(v => v.fileKey),
    ];

    if (keysToDelete.length > 0) {
      await storageService.deleteFiles(keysToDelete);
    }

    await prisma.memory.deleteMany({ where: { userId } });
    await prisma.letter.deleteMany({ where: { userId } });
    await prisma.voiceRecording.deleteMany({ where: { userId } });
    await prisma.familyMember.deleteMany({ where: { userId } });

    logger.info(`Deleted all content for user ${userId}`);
  },

  /**
   * Create checkout session with currency
   */
  async createCheckoutSession(
    userId: string,
    tier: 'ESSENTIAL' | 'FAMILY' | 'LEGACY',
    billingCycle: 'monthly' | 'yearly',
    currency: string = 'USD'
  ): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const customerId = await this.getOrCreateCustomer(
      userId,
      user.email,
      `${user.firstName} ${user.lastName}`,
      currency
    );

    const pricing = this.getPricingInCurrency(currency);
    let priceData;

    switch (tier) {
      case 'ESSENTIAL':
        priceData = billingCycle === 'monthly' ? pricing.essential.monthly : pricing.essential.yearly;
        break;
      case 'FAMILY':
        priceData = billingCycle === 'monthly' ? pricing.family.monthly : pricing.family.yearly;
        break;
      case 'LEGACY':
        priceData = pricing.legacy.yearly;
        break;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Heirloom ${tier.charAt(0) + tier.slice(1).toLowerCase()} Plan`,
            description: `${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} subscription`,
          },
          unit_amount: Math.round(priceData.amount * 100),
          recurring: {
            interval: billingCycle === 'yearly' ? 'year' : 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${env.FRONTEND_URL}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/settings?canceled=true`,
      metadata: { userId, tier },
      subscription_data: {
        metadata: { userId, tier },
      },
    });

    logger.info(`Created checkout session for user ${userId}: ${session.id}`);
    return session.url!;
  },

  /**
   * Create customer portal session
   */
  async createPortalSession(userId: string): Promise<string> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No billing account found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/settings`,
    });

    return session.url;
  },

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      default:
        logger.info(`Unhandled Stripe event: ${event.type}`);
    }
  },

  async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as SubscriptionTier;

    if (!userId || !tier) return;

    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);

    await prisma.subscription.update({
      where: { userId },
      data: {
        tier,
        status: 'ACTIVE',
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEndsAt: null,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await emailService.sendSubscriptionConfirmation(user.email, user.firstName, tier);
    }

    logger.info(`Subscription activated for user ${userId}: ${tier}`);
  },

  async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!dbSubscription) return;

    const statusMap: Record<string, SubscriptionStatus> = {
      active: 'ACTIVE',
      canceled: 'CANCELLED',
      past_due: 'PAST_DUE',
      trialing: 'TRIALING',
      incomplete: 'ACTIVE',
      incomplete_expired: 'CANCELLED',
      unpaid: 'PAST_DUE',
      paused: 'ACTIVE',
    };

    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: statusMap[subscription.status] || 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  },

  async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!dbSubscription) return;

    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        tier: 'FREE',
        status: 'CANCELLED',
        stripeSubscriptionId: null,
      },
    });
  },

  async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!dbSubscription) return;

    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status: 'PAST_DUE' },
    });

    const user = await prisma.user.findUnique({ where: { id: dbSubscription.userId } });
    if (user) {
      await emailService.sendPaymentFailed(user.email, user.firstName);
    }

    await prisma.notification.create({
      data: {
        userId: dbSubscription.userId,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: 'Your subscription payment failed. Please update your payment method.',
      },
    });
  },

  async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!dbSubscription) return;

    if (dbSubscription.status === 'PAST_DUE') {
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: { status: 'ACTIVE' },
      });
    }
  },

  /**
   * Check user's tier limits
   */
  async checkLimit(userId: string, limitType: keyof typeof TIER_LIMITS.FREE): Promise<{ allowed: boolean; current: number; max: number }> {
    const subscription = await prisma.subscription.findUnique({ where: { userId } });

    if (subscription?.status === 'TRIALING' && subscription.trialEndsAt) {
      if (new Date() > subscription.trialEndsAt) {
        await this.expireTrial(userId);
        return { allowed: false, current: 0, max: 0 };
      }
    }

    const tier = subscription?.tier || 'FREE';
    const limits = TIER_LIMITS[tier];
    const max = limits[limitType];

    let current = 0;
    switch (limitType) {
      case 'maxMemories':
        current = await prisma.memory.count({ where: { userId } });
        break;
      case 'maxLetters':
        current = await prisma.letter.count({ where: { userId } });
        break;
      case 'maxRecipients':
        current = await prisma.familyMember.count({ where: { userId } });
        break;
      case 'maxVoiceMinutes':
        const recordings = await prisma.voiceRecording.aggregate({
          where: { userId },
          _sum: { duration: true },
        });
        current = Math.ceil((recordings._sum.duration || 0) / 60);
        break;
      case 'maxStorageMB':
        const storage = await prisma.memory.aggregate({
          where: { userId },
          _sum: { fileSize: true },
        });
        current = Math.ceil((storage._sum.fileSize || 0) / (1024 * 1024));
        break;
    }

    return { allowed: max === -1 || current < max, current, max };
  },

  /**
   * Get subscription details with trial info
   */
  async getSubscriptionDetails(userId: string) {
    const subscription = await prisma.subscription.findUnique({ where: { userId } });

    if (!subscription) {
      return { tier: 'FREE', status: 'ACTIVE', isTrialing: false, trialDaysLeft: 0 };
    }

    let trialDaysLeft = 0;
    if (subscription.status === 'TRIALING' && subscription.trialEndsAt) {
      const diff = subscription.trialEndsAt.getTime() - Date.now();
      trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return {
      tier: subscription.tier,
      status: subscription.status,
      isTrialing: subscription.status === 'TRIALING',
      trialDaysLeft,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  },
};
