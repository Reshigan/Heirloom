import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../config/env';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { billingService } from '../services/billing.service';

const router = Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

/**
 * GET /api/billing/subscription
 * Get current subscription status
 */
router.get('/subscription', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const details = await billingService.getSubscriptionDetails(req.user!.id);
  res.json(details);
}));

/**
 * GET /api/billing/limits
 * Get usage limits and current usage
 */
router.get('/limits', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const [memories, letters, recipients, voice, storage] = await Promise.all([
    billingService.checkLimit(req.user!.id, 'maxMemories'),
    billingService.checkLimit(req.user!.id, 'maxLetters'),
    billingService.checkLimit(req.user!.id, 'maxRecipients'),
    billingService.checkLimit(req.user!.id, 'maxVoiceMinutes'),
    billingService.checkLimit(req.user!.id, 'maxStorageMB'),
  ]);

  res.json({
    memories,
    letters,
    recipients,
    voice,
    storage,
  });
}));

/**
 * GET /api/billing/pricing
 * Get pricing in user's currency
 */
router.get('/pricing', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const currency = req.user!.preferredCurrency || req.query.currency as string || 'USD';
  const pricing = billingService.getPricingInCurrency(currency);
  res.json({ currency, pricing });
}));

/**
 * POST /api/billing/checkout
 * Create Stripe checkout session
 */
router.post('/checkout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { tier, billingCycle = 'monthly', currency } = req.body;

  if (!['ESSENTIAL', 'FAMILY', 'LEGACY'].includes(tier)) {
    throw ApiError.badRequest('Invalid tier');
  }

  if (!['monthly', 'yearly'].includes(billingCycle)) {
    throw ApiError.badRequest('Invalid billing cycle');
  }

  const userCurrency = currency || req.user!.preferredCurrency || 'USD';
  const url = await billingService.createCheckoutSession(
    req.user!.id,
    tier,
    billingCycle,
    userCurrency
  );

  res.json({ url });
}));

/**
 * POST /api/billing/change-plan
 * Change subscription plan (upgrade or downgrade)
 */
router.post('/change-plan', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { tier, billingCycle = 'monthly' } = req.body;

  if (!['ESSENTIAL', 'FAMILY', 'LEGACY'].includes(tier)) {
    throw ApiError.badRequest('Invalid tier');
  }

  if (!['monthly', 'yearly'].includes(billingCycle)) {
    throw ApiError.badRequest('Invalid billing cycle');
  }

  const result = await billingService.changePlan(req.user!.id, tier, billingCycle);
  res.json(result);
}));

/**
 * POST /api/billing/portal
 * Create Stripe customer portal session
 */
router.post('/portal', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const url = await billingService.createPortalSession(req.user!.id);
  res.json({ url });
}));

/**
 * POST /api/billing/webhook
 * Stripe webhook handler
 */
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
  }

  await billingService.handleWebhook(event);

  res.json({ received: true });
}));

/**
 * PATCH /api/billing/currency
 * Update user's preferred currency
 */
router.patch('/currency', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { currency } = req.body;

  const validCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'AUD', 'CAD', 'INR', 'JPY', 'CNY', 'BRL'];
  if (!validCurrencies.includes(currency)) {
    throw ApiError.badRequest('Invalid currency');
  }

  const prisma = (await import('../config/database')).default;
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { preferredCurrency: currency },
  });

  res.json({ currency });
}));

export default router;
