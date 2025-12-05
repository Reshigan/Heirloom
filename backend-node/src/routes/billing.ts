import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { TIER_POLICIES } from '../config/tierPolicies';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const STRIPE_PRICE_TO_TIER: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER || '']: 'starter',
  [process.env.STRIPE_PRICE_FAMILY || '']: 'family',
  [process.env.STRIPE_PRICE_UNLIMITED || '']: 'unlimited',
  [process.env.STRIPE_PRICE_LIFETIME || '']: 'lifetime',
};

const TIER_TO_STRIPE_PRICE: Record<string, string> = {
  'starter': process.env.STRIPE_PRICE_STARTER || '',
  'family': process.env.STRIPE_PRICE_FAMILY || '',
  'unlimited': process.env.STRIPE_PRICE_UNLIMITED || '',
  'lifetime': process.env.STRIPE_PRICE_LIFETIME || '',
};

router.use(authenticate);

/**
 * Create Stripe Checkout Session
 */
router.post('/create-checkout-session', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { tier } = req.body;

    if (!tier || !['starter', 'family', 'unlimited', 'lifetime'].includes(tier)) {
      throw new AppError(400, 'Invalid tier');
    }

    const priceId = TIER_TO_STRIPE_PRICE[tier];
    if (!priceId) {
      throw new AppError(500, 'Stripe price ID not configured for this tier');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        vault: true,
        subscriptions: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    let customerId = user.subscriptions[0]?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      
      const existingSub = await prisma.subscription.findFirst({
        where: { userId: userId },
      });
      
      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: { stripeCustomerId: customerId },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: userId,
            stripeCustomerId: customerId,
            tier: tier,
            status: 'active',
          },
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: tier === 'lifetime' ? 'payment' : 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        tier: tier,
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create Stripe Customer Portal Session
 */
router.post('/create-portal-session', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: true },
    });

    if (!user || !user.subscriptions[0]?.stripeCustomerId) {
      throw new AppError(400, 'No active subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscriptions[0].stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.json({
      url: session.url,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get current subscription status
 */
router.get('/subscription', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vault: true,
        subscriptions: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    let subscriptionData = null;
    const userSubscription = user.subscriptions[0];

    if (userSubscription?.stripeCustomerId && userSubscription?.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(userSubscription.stripeSubscriptionId);
        subscriptionData = {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          tier: user.vault?.tier || 'starter',
        };
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    res.json({
      tier: user.vault?.tier || 'starter',
      subscription: subscriptionData,
      limits: TIER_POLICIES[user.vault?.tier || 'starter'],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Stripe Webhook Handler
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Webhook processing error');
  }
});

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const tierPolicy = TIER_POLICIES[tier];
  if (!tierPolicy) {
    console.error('Invalid tier:', tier);
    return;
  }

  await prisma.vault.update({
    where: { userId },
    data: {
      tier,
      storageLimitBytes: BigInt(tierPolicy.storageLimitGB * 1024 * 1024 * 1024), // Convert GB to bytes
      uploadLimitWeekly: tierPolicy.weeklyUploadLimit,
    },
  });

  if (session.subscription) {
    const existingSub = await prisma.subscription.findFirst({
      where: { userId },
    });
    
    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          stripeSubscriptionId: session.subscription as string,
          tier,
          status: 'active',
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          stripeSubscriptionId: session.subscription as string,
          tier,
          status: 'active',
        },
      });
    }
  }

  console.log(`Checkout completed for user ${userId}, tier: ${tier}`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!userSubscription) {
    console.error('Subscription not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = STRIPE_PRICE_TO_TIER[priceId] || 'starter';

  const tierPolicy = TIER_POLICIES[tier];
  if (!tierPolicy) {
    console.error('Invalid tier:', tier);
    return;
  }

  await prisma.vault.update({
    where: { userId: userSubscription.userId },
    data: {
      tier,
      storageLimitBytes: BigInt(tierPolicy.storageLimitGB * 1024 * 1024 * 1024),
      uploadLimitWeekly: tierPolicy.weeklyUploadLimit,
    },
  });

  await prisma.subscription.update({
    where: { id: userSubscription.id },
    data: {
      stripeSubscriptionId: subscription.id,
      tier,
      status: subscription.status,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    },
  });

  console.log(`Subscription updated for user ${userSubscription.userId}, tier: ${tier}, status: ${subscription.status}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!userSubscription) {
    console.error('Subscription not found for customer:', customerId);
    return;
  }

  const starterTierPolicy = TIER_POLICIES['starter'];

  await prisma.vault.update({
    where: { userId: userSubscription.userId },
    data: {
      tier: 'starter',
      storageLimitBytes: BigInt(starterTierPolicy.storageLimitGB * 1024 * 1024 * 1024),
      uploadLimitWeekly: starterTierPolicy.weeklyUploadLimit,
    },
  });

  await prisma.subscription.update({
    where: { id: userSubscription.id },
    data: {
      stripeSubscriptionId: null,
      tier: 'starter',
      status: 'cancelled',
    },
  });

  console.log(`Subscription deleted for user ${userSubscription.userId}, downgraded to starter tier`);
}

export default router;
