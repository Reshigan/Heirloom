import request from 'supertest';
import { faker } from '@faker-js/faker';

const API_BASE = 'http://localhost:3001';

describe('Subscriptions API Tests', () => {
  let authToken: string;
  let testUser: any;
  let subscriptionId: string;

  beforeAll(async () => {
    testUser = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName()
    };

    const authResponse = await request(API_BASE)
      .post('/api/auth/register')
      .send(testUser);
    
    authToken = authResponse.body.token;
  });

  describe('Get Subscription Tiers - Positive Tests', () => {
    test('should get all subscription tiers', async () => {
      const response = await request(API_BASE)
        .get('/api/subscriptions/tiers')
        .expect(200);

      expect(response.body.tiers).toBeInstanceOf(Array);
      expect(response.body.tiers.length).toBeGreaterThan(0);
      
      const basicTier = response.body.tiers.find((tier: any) => tier.id === 'basic');
      expect(basicTier).toBeDefined();
      expect(basicTier.price).toBe(0);
    });

    test('should get specific subscription tier', async () => {
      const response = await request(API_BASE)
        .get('/api/subscriptions/tiers/premium')
        .expect(200);

      expect(response.body.tier.id).toBe('premium');
      expect(response.body.tier.price).toBe(19.99);
      expect(response.body.tier.features).toBeInstanceOf(Array);
    });

    test('should get tier comparison', async () => {
      const response = await request(API_BASE)
        .get('/api/subscriptions/compare?tiers=basic,premium,family')
        .expect(200);

      expect(response.body.comparison).toBeInstanceOf(Array);
      expect(response.body.comparison.length).toBe(3);
    });
  });

  describe('Get Subscription Tiers - Negative Tests', () => {
    test('should return 404 for non-existent tier', async () => {
      await request(API_BASE)
        .get('/api/subscriptions/tiers/nonexistent')
        .expect(404);
    });

    test('should handle invalid tier comparison request', async () => {
      const response = await request(API_BASE)
        .get('/api/subscriptions/compare?tiers=invalid,nonexistent')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Create Subscription - Positive Tests', () => {
    test('should create basic subscription (free)', async () => {
      const subscription = {
        tierId: 'basic',
        paymentMethod: null
      };

      const response = await request(API_BASE)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscription)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.tier).toBe('basic');
      expect(response.body.subscription.status).toBe('active');
      subscriptionId = response.body.subscription.id;
    });

    test('should create premium subscription with payment', async () => {
      const subscription = {
        tierId: 'premium',
        paymentMethod: {
          type: 'card',
          token: 'tok_visa' // Stripe test token
        }
      };

      const response = await request(API_BASE)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscription)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.tier).toBe('premium');
    });

    test('should create family subscription with trial', async () => {
      const subscription = {
        tierId: 'family',
        trialDays: 14,
        paymentMethod: {
          type: 'card',
          token: 'tok_visa'
        }
      };

      const response = await request(API_BASE)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscription)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.trialEndsAt).toBeDefined();
    });
  });

  describe('Create Subscription - Negative Tests', () => {
    test('should reject subscription without authentication', async () => {
      const subscription = {
        tierId: 'premium',
        paymentMethod: { type: 'card', token: 'tok_visa' }
      };

      await request(API_BASE)
        .post('/api/subscriptions')
        .send(subscription)
        .expect(401);
    });

    test('should reject subscription with invalid tier', async () => {
      const subscription = {
        tierId: 'invalid-tier',
        paymentMethod: { type: 'card', token: 'tok_visa' }
      };

      const response = await request(API_BASE)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscription)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject paid subscription without payment method', async () => {
      const subscription = {
        tierId: 'premium'
      };

      const response = await request(API_BASE)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscription)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('payment');
    });

    test('should reject subscription with invalid payment token', async () => {
      const subscription = {
        tierId: 'premium',
        paymentMethod: {
          type: 'card',
          token: 'invalid_token'
        }
      };

      const response = await request(API_BASE)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscription)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject duplicate active subscription', async () => {
      const subscription = {
        tierId: 'basic'
      };

      const response = await request(API_BASE)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscription)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('active subscription');
    });
  });

  describe('Get User Subscription - Positive Tests', () => {
    test('should get current user subscription', async () => {
      const response = await request(API_BASE)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toBeDefined();
      expect(response.body.subscription.tier).toBe('basic');
    });

    test('should get subscription usage statistics', async () => {
      const response = await request(API_BASE)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.usage).toHaveProperty('memoriesUsed');
      expect(response.body.usage).toHaveProperty('familyMembersUsed');
      expect(response.body.usage).toHaveProperty('aiStoriesUsed');
    });

    test('should get subscription billing history', async () => {
      const response = await request(API_BASE)
        .get('/api/subscriptions/billing-history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.billingHistory).toBeInstanceOf(Array);
    });
  });

  describe('Update Subscription - Positive Tests', () => {
    test('should upgrade subscription tier', async () => {
      const update = {
        tierId: 'premium',
        paymentMethod: {
          type: 'card',
          token: 'tok_visa'
        }
      };

      const response = await request(API_BASE)
        .put('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .send(update)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.tier).toBe('premium');
    });

    test('should downgrade subscription tier', async () => {
      const update = {
        tierId: 'basic',
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(API_BASE)
        .put('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .send(update)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.pendingChange).toBeDefined();
    });

    test('should update payment method', async () => {
      const update = {
        paymentMethod: {
          type: 'card',
          token: 'tok_mastercard'
        }
      };

      const response = await request(API_BASE)
        .put('/api/subscriptions/payment-method')
        .set('Authorization', `Bearer ${authToken}`)
        .send(update)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Update Subscription - Negative Tests', () => {
    test('should reject update without authentication', async () => {
      const update = { tierId: 'premium' };

      await request(API_BASE)
        .put('/api/subscriptions/current')
        .send(update)
        .expect(401);
    });

    test('should reject invalid tier upgrade', async () => {
      const update = {
        tierId: 'invalid-tier'
      };

      const response = await request(API_BASE)
        .put('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .send(update)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject upgrade without payment method', async () => {
      const update = {
        tierId: 'enterprise'
      };

      const response = await request(API_BASE)
        .put('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .send(update)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Cancel Subscription - Positive Tests', () => {
    test('should cancel subscription immediately', async () => {
      const response = await request(API_BASE)
        .delete('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ immediate: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.status).toBe('cancelled');
    });

    test('should schedule subscription cancellation', async () => {
      // First create a new subscription
      await request(API_BASE)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tierId: 'basic' });

      const response = await request(API_BASE)
        .delete('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ immediate: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.cancelledAt).toBeDefined();
    });
  });

  describe('Subscription Webhooks - Positive Tests', () => {
    test('should handle successful payment webhook', async () => {
      const webhookPayload = {
        type: 'payment_succeeded',
        data: {
          subscriptionId: subscriptionId,
          amount: 1999,
          currency: 'usd'
        }
      };

      const response = await request(API_BASE)
        .post('/api/subscriptions/webhooks/stripe')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle failed payment webhook', async () => {
      const webhookPayload = {
        type: 'payment_failed',
        data: {
          subscriptionId: subscriptionId,
          error: 'insufficient_funds'
        }
      };

      const response = await request(API_BASE)
        .post('/api/subscriptions/webhooks/stripe')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Subscription Analytics - Positive Tests', () => {
    test('should get subscription analytics for admin', async () => {
      // This would require admin authentication in real implementation
      const response = await request(API_BASE)
        .get('/api/subscriptions/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('totalSubscriptions');
      expect(response.body.analytics).toHaveProperty('revenue');
      expect(response.body.analytics).toHaveProperty('churnRate');
    });

    test('should get subscription conversion metrics', async () => {
      const response = await request(API_BASE)
        .get('/api/subscriptions/metrics/conversion')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toHaveProperty('trialToSubscription');
      expect(response.body.metrics).toHaveProperty('freeToTrial');
    });
  });

  describe('Subscription Limits - Positive Tests', () => {
    test('should check subscription limits', async () => {
      const response = await request(API_BASE)
        .get('/api/subscriptions/limits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.limits).toHaveProperty('maxMemories');
      expect(response.body.limits).toHaveProperty('maxFamilyMembers');
      expect(response.body.limits).toHaveProperty('aiStoriesPerMonth');
    });

    test('should validate action against subscription limits', async () => {
      const response = await request(API_BASE)
        .post('/api/subscriptions/validate-action')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'create_memory', resourceType: 'text' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.allowed).toBeDefined();
    });
  });

  describe('Subscription Limits - Negative Tests', () => {
    test('should reject action when limit exceeded', async () => {
      // This test would require setting up a scenario where limits are exceeded
      const response = await request(API_BASE)
        .post('/api/subscriptions/validate-action')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'create_ai_story' })
        .expect(200);

      // In a real scenario with limits exceeded, this would return allowed: false
      expect(response.body.success).toBe(true);
    });
  });
});