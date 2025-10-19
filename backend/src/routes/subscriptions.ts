import { FastifyPluginAsync } from 'fastify';
import { paymentService, SUBSCRIPTION_TIERS } from '../services/PaymentService.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16',
});

const subscriptionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'subscriptions',
      timestamp: new Date().toISOString()
    };
  });

  // Get subscription tiers
  fastify.get('/tiers', async (request, reply) => {
    return {
      tiers: SUBSCRIPTION_TIERS.map(tier => ({
        id: tier.id,
        name: tier.name,
        price: tier.price / 100, // Convert cents to dollars
        interval: tier.interval,
        features: tier.features,
        maxMemories: tier.maxMemories,
        maxFamilyMembers: tier.maxFamilyMembers,
        aiStoriesPerMonth: tier.aiStoriesPerMonth,
        timeCapsules: tier.timeCapsules,
        priority: tier.priority
      }))
    };
  });

  // Get current user's subscription
  fastify.get('/current', {
    preHandler: [fastify.authenticate]
  }, async (request: any, reply) => {
    try {
      const limits = await paymentService.getSubscriptionLimits(request.user.userId);
      return { subscription: limits };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to get subscription' });
    }
  });

  // Create subscription
  fastify.post('/create', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['tierId'],
        properties: {
          tierId: { type: 'string' },
          paymentMethodId: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { tierId, paymentMethodId } = request.body;
      const result = await paymentService.createSubscription(
        request.user.userId,
        tierId,
        paymentMethodId
      );
      return result;
    } catch (error) {
      fastify.log.error('Failed to create subscription:', error);
      reply.code(500).send({ error: 'Failed to create subscription' });
    }
  });

  // Create payment intent for subscription
  fastify.post('/payment-intent', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['tierId'],
        properties: {
          tierId: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { tierId } = request.body;
      const tier = SUBSCRIPTION_TIERS.find(t => t.id === tierId);
      
      if (!tier) {
        return reply.code(400).send({ error: 'Invalid subscription tier' });
      }

      if (tier.price === 0) {
        return reply.code(400).send({ error: 'Free tier does not require payment' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: tier.price,
        currency: 'usd',
        metadata: {
          userId: request.user.userId,
          tierId: tier.id
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        amount: tier.price
      };
    } catch (error) {
      fastify.log.error('Failed to create payment intent:', error);
      reply.code(500).send({ error: 'Failed to create payment intent' });
    }
  });

  // Stripe webhook endpoint
  fastify.post('/webhook', {
    config: {
      rawBody: true
    }
  }, async (request, reply) => {
    try {
      const sig = request.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';
      
      let event: Stripe.Event;
      
      try {
        event = stripe.webhooks.constructEvent(request.rawBody!, sig, endpointSecret);
      } catch (err: any) {
        fastify.log.error(`Webhook signature verification failed: ${err.message}`);
        return reply.code(400).send(`Webhook Error: ${err.message}`);
      }

      await paymentService.handleWebhook(event);
      return { received: true };
    } catch (error) {
      fastify.log.error('Failed to handle webhook:', error);
      reply.code(500).send({ error: 'Failed to handle webhook' });
    }
  });

  // Check if user can perform action
  fastify.post('/check-limit', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string' },
          currentCount: { type: 'number' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { action, currentCount } = request.body;
      const canPerform = await paymentService.canPerformAction(
        request.user.userId,
        action,
        currentCount
      );
      return { canPerform };
    } catch (error) {
      fastify.log.error('Failed to check limit:', error);
      reply.code(500).send({ error: 'Failed to check limit' });
    }
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'subscriptions service is running',
      endpoints: [
        'GET /health',
        'GET /tiers',
        'GET /current',
        'POST /create',
        'POST /payment-intent',
        'POST /webhook',
        'POST /check-limit'
      ]
    };
  });
};

export default subscriptionsRoutes;
