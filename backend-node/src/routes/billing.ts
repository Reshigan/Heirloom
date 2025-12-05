import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { TIER_POLICIES } from '../config/tierPolicies';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

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
      include: { vault: true },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
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
    });

    if (!user || !user.stripeCustomerId) {
      throw new AppError(400, 'No active subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
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
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    let subscriptionData = null;

    if (user.stripeCustomerId && user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        subscriptionData = {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          tier: user.vault?.tier || 'free',
        };
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    res.json({
      tier: user.vault?.tier || 'free',
      subscription: subscriptionData,
      limits: TIER_POLICIES[user.vault?.tier || 'free'],
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
      storageLimit: tierPolicy.storageLimitGB * 1024 * 1024 * 1024, // Convert GB to bytes
      uploadLimitWeekly: tierPolicy.uploadLimitWeekly,
      uploadLimitMonthly: tierPolicy.uploadLimitMonthly,
    },
  });

  if (session.subscription) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: session.subscription as string,
      },
    });
  }

  console.log(`Checkout completed for user ${userId}, tier: ${tier}`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = STRIPE_PRICE_TO_TIER[priceId] || 'free';

  const tierPolicy = TIER_POLICIES[tier];
  if (!tierPolicy) {
    console.error('Invalid tier:', tier);
    return;
  }

  await prisma.vault.update({
    where: { userId: user.id },
    data: {
      tier,
      storageLimit: tierPolicy.storageLimitGB * 1024 * 1024 * 1024,
      uploadLimitWeekly: tierPolicy.uploadLimitWeekly,
      uploadLimitMonthly: tierPolicy.uploadLimitMonthly,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
    },
  });

  console.log(`Subscription updated for user ${user.id}, tier: ${tier}, status: ${subscription.status}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  const freeTierPolicy = TIER_POLICIES['free'];

  await prisma.vault.update({
    where: { userId: user.id },
    data: {
      tier: 'free',
      storageLimit: freeTierPolicy.storageLimitGB * 1024 * 1024 * 1024,
      uploadLimitWeekly: freeTierPolicy.uploadLimitWeekly,
      uploadLimitMonthly: freeTierPolicy.uploadLimitMonthly,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: null,
    },
  });

  console.log(`Subscription deleted for user ${user.id}, downgraded to free tier`);
}

export default router;
