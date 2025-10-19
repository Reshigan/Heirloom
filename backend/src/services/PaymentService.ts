import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  maxMemories: number;
  maxFamilyMembers: number;
  aiStoriesPerMonth: number;
  timeCapsules: number;
  priority: number;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic Legacy',
    price: 0,
    interval: 'month',
    features: [
      '100 memories',
      '5 family members',
      '2 AI stories per month',
      '3 time capsules',
      'Basic constellation view'
    ],
    maxMemories: 100,
    maxFamilyMembers: 5,
    aiStoriesPerMonth: 2,
    timeCapsules: 3,
    priority: 1
  },
  {
    id: 'premium',
    name: 'Premium Legacy',
    price: 1999, // $19.99
    interval: 'month',
    features: [
      'Unlimited memories',
      '25 family members',
      '20 AI stories per month',
      'Unlimited time capsules',
      'Advanced constellation features',
      'Priority support',
      'HD video storage',
      'Advanced privacy controls'
    ],
    maxMemories: -1, // unlimited
    maxFamilyMembers: 25,
    aiStoriesPerMonth: 20,
    timeCapsules: -1, // unlimited
    priority: 2
  },
  {
    id: 'family',
    name: 'Family Legacy',
    price: 3999, // $39.99
    interval: 'month',
    features: [
      'Everything in Premium',
      'Unlimited family members',
      'Unlimited AI stories',
      'Collaborative storytelling',
      'Family tree visualization',
      'Advanced analytics',
      'Custom branding',
      'Dedicated family coordinator'
    ],
    maxMemories: -1,
    maxFamilyMembers: -1,
    aiStoriesPerMonth: -1,
    timeCapsules: -1,
    priority: 3
  },
  {
    id: 'enterprise',
    name: 'Enterprise Legacy',
    price: 9999, // $99.99
    interval: 'month',
    features: [
      'Everything in Family',
      'Multi-organization support',
      'Advanced security features',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantees',
      'White-label options',
      'API access',
      'Advanced compliance features'
    ],
    maxMemories: -1,
    maxFamilyMembers: -1,
    aiStoriesPerMonth: -1,
    timeCapsules: -1,
    priority: 4
  }
];

export class PaymentService {
  /**
   * Create a new customer in Stripe
   */
  async createCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });

      logger.info(`Created Stripe customer ${customer.id} for user ${userId}`);
      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create a subscription for a user
   */
  async createSubscription(
    userId: string,
    tierId: string,
    paymentMethodId?: string
  ): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
      if (!tier) {
        throw new Error('Invalid subscription tier');
      }

      // Free tier doesn't need Stripe
      if (tier.price === 0) {
        return this.createFreeSubscription(userId, tier);
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        customerId = await this.createCustomer(userId, user.email, `${user.firstName} ${user.lastName}`);
      }

      // Create Stripe price if it doesn't exist
      const priceId = await this.getOrCreatePrice(tier);

      const subscriptionData: any = {
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          userId,
          tierId
        },
        expand: ['latest_invoice.payment_intent']
      };

      if (paymentMethodId) {
        subscriptionData.default_payment_method = paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);

      // Save subscription to database
      await this.saveSubscription(userId, subscription, tier);

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        status: subscription.status
      };
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Create a free subscription (no Stripe involved)
   */
  private async createFreeSubscription(userId: string, tier: SubscriptionTier) {
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        tierId: tier.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        maxMemories: tier.maxMemories,
        maxFamilyMembers: tier.maxFamilyMembers,
        aiStoriesPerMonth: tier.aiStoriesPerMonth,
        timeCapsules: tier.timeCapsules
      },
      create: {
        userId,
        tierId: tier.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxMemories: tier.maxMemories,
        maxFamilyMembers: tier.maxFamilyMembers,
        aiStoriesPerMonth: tier.aiStoriesPerMonth,
        timeCapsules: tier.timeCapsules
      }
    });

    return {
      subscriptionId: subscription.id,
      status: 'active'
    };
  }

  /**
   * Get or create a Stripe price for a subscription tier
   */
  private async getOrCreatePrice(tier: SubscriptionTier): Promise<string> {
    try {
      // Try to find existing price
      const prices = await stripe.prices.list({
        lookup_keys: [`heirloom_${tier.id}_${tier.interval}`],
        limit: 1
      });

      if (prices.data.length > 0) {
        return prices.data[0].id;
      }

      // Create new price
      const price = await stripe.prices.create({
        unit_amount: tier.price,
        currency: 'usd',
        recurring: {
          interval: tier.interval
        },
        product_data: {
          name: tier.name,
          description: `Heirloom ${tier.name} - ${tier.features.join(', ')}`
        },
        lookup_key: `heirloom_${tier.id}_${tier.interval}`
      });

      return price.id;
    } catch (error) {
      logger.error('Failed to get or create price:', error);
      throw error;
    }
  }

  /**
   * Save subscription to database
   */
  private async saveSubscription(userId: string, stripeSubscription: any, tier: SubscriptionTier) {
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: stripeSubscription.id,
        tierId: tier.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        maxMemories: tier.maxMemories,
        maxFamilyMembers: tier.maxFamilyMembers,
        aiStoriesPerMonth: tier.aiStoriesPerMonth,
        timeCapsules: tier.timeCapsules
      },
      create: {
        userId,
        stripeSubscriptionId: stripeSubscription.id,
        tierId: tier.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        maxMemories: tier.maxMemories,
        maxFamilyMembers: tier.maxFamilyMembers,
        aiStoriesPerMonth: tier.aiStoriesPerMonth,
        timeCapsules: tier.timeCapsules
      }
    });
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.Invoice);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.Invoice);
          break;
        
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Failed to handle webhook:', error);
      throw error;
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    const tierId = subscription.metadata.tierId;
    
    if (!userId || !tierId) {
      logger.error('Missing metadata in subscription update');
      return;
    }

    const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
    if (!tier) {
      logger.error(`Invalid tier ID: ${tierId}`);
      return;
    }

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    logger.info(`Updated subscription for user ${userId}`);
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    
    if (!userId) {
      logger.error('Missing userId in subscription cancellation');
      return;
    }

    // Downgrade to free tier
    const freeTier = SUBSCRIPTION_TIERS.find(t => t.id === 'basic');
    if (freeTier) {
      await this.createFreeSubscription(userId, freeTier);
    }

    logger.info(`Downgraded user ${userId} to free tier after cancellation`);
  }

  private async handlePaymentSuccess(invoice: Stripe.Invoice) {
    logger.info(`Payment succeeded for invoice ${invoice.id}`);
    // Could trigger welcome emails, analytics events, etc.
  }

  private async handlePaymentFailure(invoice: Stripe.Invoice) {
    logger.error(`Payment failed for invoice ${invoice.id}`);
    // Could trigger retry logic, notifications, etc.
  }

  /**
   * Get subscription limits for a user
   */
  async getSubscriptionLimits(userId: string): Promise<SubscriptionTier | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return SUBSCRIPTION_TIERS.find(t => t.id === 'basic') || null;
    }

    return SUBSCRIPTION_TIERS.find(t => t.id === subscription.tierId) || null;
  }

  /**
   * Check if user can perform an action based on their subscription
   */
  async canPerformAction(userId: string, action: string, currentCount?: number): Promise<boolean> {
    const limits = await this.getSubscriptionLimits(userId);
    if (!limits) return false;

    switch (action) {
      case 'create_memory':
        return limits.maxMemories === -1 || (currentCount || 0) < limits.maxMemories;
      
      case 'add_family_member':
        return limits.maxFamilyMembers === -1 || (currentCount || 0) < limits.maxFamilyMembers;
      
      case 'generate_ai_story':
        // Check monthly usage
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyUsage = await prisma.aIInteraction.count({
          where: {
            userId,
            type: 'story_generation',
            createdAt: {
              gte: new Date(currentYear, currentMonth, 1),
              lt: new Date(currentYear, currentMonth + 1, 1)
            }
          }
        });
        return limits.aiStoriesPerMonth === -1 || monthlyUsage < limits.aiStoriesPerMonth;
      
      case 'create_time_capsule':
        return limits.timeCapsules === -1 || (currentCount || 0) < limits.timeCapsules;
      
      default:
        return true;
    }
  }

  /**
   * Apply referral discount
   */
  async applyReferralDiscount(userId: string, referralCode: string): Promise<boolean> {
    try {
      // Check if referral gives free month
      const referralStats = await prisma.referral.findFirst({
        where: {
          referrerUserId: userId,
          status: 'completed'
        },
        include: {
          _count: {
            select: { id: true }
          }
        }
      });

      // If user has referred 5 people, give them a free month
      if (referralStats && referralStats._count.id >= 5) {
        const subscription = await prisma.subscription.findUnique({
          where: { userId }
        });

        if (subscription && subscription.stripeSubscriptionId) {
          // Extend current period by 1 month
          const newEndDate = new Date(subscription.currentPeriodEnd);
          newEndDate.setMonth(newEndDate.getMonth() + 1);

          await prisma.subscription.update({
            where: { userId },
            data: {
              currentPeriodEnd: newEndDate,
              freeMonthsRemaining: (subscription.freeMonthsRemaining || 0) + 1
            }
          });

          logger.info(`Applied free month to user ${userId} for referral milestone`);
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Failed to apply referral discount:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();