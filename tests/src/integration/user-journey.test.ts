import request from 'supertest';
import { faker } from '@faker-js/faker';

const API_BASE = 'http://localhost:3001';

describe('User Journey Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let familyId: string;
  let memoryId: string;
  let subscriptionId: string;

  beforeAll(() => {
    testUser = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' })
    };
  });

  describe('Complete User Onboarding Journey', () => {
    test('should complete full user registration and onboarding', async () => {
      // Step 1: Register user
      const registerResponse = await request(API_BASE)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.email).toBe(testUser.email);
      authToken = registerResponse.body.token;

      // Step 2: Complete profile setup
      const profileResponse = await request(API_BASE)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'I love preserving family memories',
          location: 'New York, USA',
          interests: ['family', 'photography', 'storytelling']
        })
        .expect(200);

      expect(profileResponse.body.success).toBe(true);

      // Step 3: Create family
      const familyResponse = await request(API_BASE)
        .post('/api/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `${testUser.lastName} Family`,
          description: 'Our family memories and stories'
        })
        .expect(201);

      expect(familyResponse.body.success).toBe(true);
      familyId = familyResponse.body.family.id;

      // Step 4: Create first memory
      const memoryResponse = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'My First Memory',
          content: 'This is my first memory on Loominary platform',
          type: 'text',
          familyId: familyId
        })
        .expect(201);

      expect(memoryResponse.body.success).toBe(true);
      memoryId = memoryResponse.body.memory.id;

      // Step 5: Generate AI story
      const aiStoryResponse = await request(API_BASE)
        .post('/api/ai/generate-story')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId,
          style: 'narrative',
          length: 'medium'
        })
        .expect(200);

      expect(aiStoryResponse.body.success).toBe(true);
      expect(aiStoryResponse.body.story).toBeDefined();

      // Step 6: Verify onboarding completion
      const userResponse = await request(API_BASE)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(userResponse.body.user.onboardingCompleted).toBe(true);
    });
  });

  describe('Subscription Upgrade Journey', () => {
    test('should upgrade from basic to premium subscription', async () => {
      // Step 1: Check current subscription
      const currentSubResponse = await request(API_BASE)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(currentSubResponse.body.subscription.tier).toBe('basic');

      // Step 2: Get subscription tiers
      const tiersResponse = await request(API_BASE)
        .get('/api/subscriptions/tiers')
        .expect(200);

      const premiumTier = tiersResponse.body.tiers.find((tier: any) => tier.id === 'premium');
      expect(premiumTier).toBeDefined();

      // Step 3: Upgrade to premium
      const upgradeResponse = await request(API_BASE)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tierId: 'premium',
          paymentMethod: {
            type: 'card',
            token: 'tok_visa' // Stripe test token
          }
        })
        .expect(201);

      expect(upgradeResponse.body.success).toBe(true);
      expect(upgradeResponse.body.subscription.tier).toBe('premium');
      subscriptionId = upgradeResponse.body.subscription.id;

      // Step 4: Verify upgraded features are available
      const featuresResponse = await request(API_BASE)
        .get('/api/subscriptions/features')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(featuresResponse.body.features.unlimitedMemories).toBe(true);
      expect(featuresResponse.body.features.aiStoriesPerMonth).toBeGreaterThan(2);
    });
  });

  describe('Family Collaboration Journey', () => {
    test('should invite family member and collaborate on memories', async () => {
      // Step 1: Invite family member
      const inviteResponse = await request(API_BASE)
        .post(`/api/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: faker.internet.email(),
          role: 'member',
          message: 'Join our family memories!'
        })
        .expect(200);

      expect(inviteResponse.body.success).toBe(true);
      const inviteId = inviteResponse.body.invitation.id;

      // Step 2: Create shared memory
      const sharedMemoryResponse = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Family Gathering',
          content: 'Our wonderful family gathering last weekend',
          type: 'text',
          familyId: familyId,
          isShared: true,
          collaborators: ['family']
        })
        .expect(201);

      expect(sharedMemoryResponse.body.success).toBe(true);
      const sharedMemoryId = sharedMemoryResponse.body.memory.id;

      // Step 3: Add comment to shared memory
      const commentResponse = await request(API_BASE)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: sharedMemoryId,
          content: 'What a wonderful day that was!'
        })
        .expect(201);

      expect(commentResponse.body.success).toBe(true);

      // Step 4: Get family activity feed
      const activityResponse = await request(API_BASE)
        .get(`/api/families/${familyId}/activity`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(activityResponse.body.activities).toBeInstanceOf(Array);
      expect(activityResponse.body.activities.length).toBeGreaterThan(0);
    });
  });

  describe('Content Creation and AI Enhancement Journey', () => {
    test('should create rich content with AI enhancements', async () => {
      // Step 1: Create photo memory
      const photoMemoryResponse = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Beach Vacation Photos',
          content: 'Amazing photos from our beach vacation',
          type: 'photo',
          mediaUrl: faker.image.url(),
          metadata: {
            location: 'Miami Beach, FL',
            date: new Date().toISOString(),
            camera: 'iPhone 15 Pro'
          }
        })
        .expect(201);

      const photoMemoryId = photoMemoryResponse.body.memory.id;

      // Step 2: Generate AI story from photo
      const aiStoryResponse = await request(API_BASE)
        .post('/api/ai/generate-story')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: photoMemoryId,
          style: 'poetic',
          length: 'medium'
        })
        .expect(200);

      expect(aiStoryResponse.body.success).toBe(true);

      // Step 3: Analyze sentiment
      const sentimentResponse = await request(API_BASE)
        .post('/api/ai/analyze-sentiment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: photoMemoryId
        })
        .expect(200);

      expect(sentimentResponse.body.analysis.sentiment).toBeDefined();

      // Step 4: Get AI tag suggestions
      const tagsResponse = await request(API_BASE)
        .post('/api/ai/suggest-tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: photoMemoryId
        })
        .expect(200);

      expect(tagsResponse.body.tags).toBeInstanceOf(Array);

      // Step 5: Apply suggested tags
      const updateResponse = await request(API_BASE)
        .put(`/api/memories/${photoMemoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tags: tagsResponse.body.tags.slice(0, 5)
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
    });
  });

  describe('Time Capsule Creation Journey', () => {
    test('should create and schedule time capsule', async () => {
      // Step 1: Create time capsule
      const timeCapsuleResponse = await request(API_BASE)
        .post('/api/time-capsules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Message to Future Self',
          content: 'Dear future me, I hope you remember this moment...',
          deliveryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          recipients: [testUser.email],
          type: 'personal'
        })
        .expect(201);

      expect(timeCapsuleResponse.body.success).toBe(true);
      const timeCapsuleId = timeCapsuleResponse.body.timeCapsule.id;

      // Step 2: Add memories to time capsule
      const addMemoryResponse = await request(API_BASE)
        .post(`/api/time-capsules/${timeCapsuleId}/memories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryIds: [memoryId]
        })
        .expect(200);

      expect(addMemoryResponse.body.success).toBe(true);

      // Step 3: Schedule delivery
      const scheduleResponse = await request(API_BASE)
        .post(`/api/time-capsules/${timeCapsuleId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deliveryMethod: 'email',
          reminderDays: [30, 7, 1] // Remind 30, 7, and 1 day before
        })
        .expect(200);

      expect(scheduleResponse.body.success).toBe(true);

      // Step 4: Get time capsule status
      const statusResponse = await request(API_BASE)
        .get(`/api/time-capsules/${timeCapsuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body.timeCapsule.status).toBe('scheduled');
    });
  });

  describe('Referral System Journey', () => {
    test('should complete referral process', async () => {
      // Step 1: Get referral code
      const referralResponse = await request(API_BASE)
        .get('/api/referrals/code')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(referralResponse.body.referralCode).toBeDefined();
      const referralCode = referralResponse.body.referralCode;

      // Step 2: Create referred users (simulate 5 referrals)
      const referredUsers = [];
      for (let i = 0; i < 5; i++) {
        const referredUser = {
          email: faker.internet.email(),
          password: faker.internet.password({ length: 12 }),
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          referralCode: referralCode
        };

        const referredResponse = await request(API_BASE)
          .post('/api/auth/register')
          .send(referredUser)
          .expect(201);

        referredUsers.push(referredResponse.body.user);
      }

      // Step 3: Check referral status
      const statusResponse = await request(API_BASE)
        .get('/api/referrals/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body.totalReferrals).toBe(5);
      expect(statusResponse.body.rewardEarned).toBe(true);

      // Step 4: Claim reward
      const claimResponse = await request(API_BASE)
        .post('/api/referrals/claim-reward')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(claimResponse.body.success).toBe(true);
      expect(claimResponse.body.reward.type).toBe('free_month');

      // Step 5: Verify subscription extension
      const updatedSubResponse = await request(API_BASE)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedSubResponse.body.subscription.freeMonthsRemaining).toBeGreaterThan(0);
    });
  });

  describe('Analytics and Insights Journey', () => {
    test('should generate comprehensive user analytics', async () => {
      // Step 1: Get memory analytics
      const memoryAnalyticsResponse = await request(API_BASE)
        .get('/api/memories/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(memoryAnalyticsResponse.body.analytics.totalMemories).toBeGreaterThan(0);

      // Step 2: Get AI usage analytics
      const aiAnalyticsResponse = await request(API_BASE)
        .get('/api/ai/usage/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(aiAnalyticsResponse.body.stats).toBeDefined();

      // Step 3: Get family insights
      const familyInsightsResponse = await request(API_BASE)
        .get(`/api/families/${familyId}/insights`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(familyInsightsResponse.body.insights).toBeDefined();

      // Step 4: Get personalized recommendations
      const recommendationsResponse = await request(API_BASE)
        .get('/api/ai/recommendations/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(recommendationsResponse.body.recommendations).toBeInstanceOf(Array);

      // Step 5: Export user data
      const exportResponse = await request(API_BASE)
        .post('/api/users/export-data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          includeMemories: true,
          includeAnalytics: true
        })
        .expect(200);

      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.exportId).toBeDefined();
    });
  });

  describe('Account Management Journey', () => {
    test('should manage account settings and privacy', async () => {
      // Step 1: Update privacy settings
      const privacyResponse = await request(API_BASE)
        .put('/api/users/privacy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileVisibility: 'family',
          memoryDefaultVisibility: 'private',
          allowAIProcessing: true,
          allowAnalytics: true,
          marketingEmails: false
        })
        .expect(200);

      expect(privacyResponse.body.success).toBe(true);

      // Step 2: Update notification preferences
      const notificationResponse = await request(API_BASE)
        .put('/api/users/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: {
            memoryReminders: true,
            familyActivity: true,
            aiStoryReady: true,
            timeCapsuleDelivery: true
          },
          push: {
            memoryReminders: false,
            familyActivity: true
          }
        })
        .expect(200);

      expect(notificationResponse.body.success).toBe(true);

      // Step 3: Download account data
      const downloadResponse = await request(API_BASE)
        .get('/api/users/download-data')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(downloadResponse.headers['content-type']).toContain('application/zip');

      // Step 4: Test account deactivation (without actually deactivating)
      const deactivateTestResponse = await request(API_BASE)
        .post('/api/users/deactivate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'testing',
          feedback: 'Just testing the deactivation flow',
          dryRun: true // Test parameter to not actually deactivate
        })
        .expect(200);

      expect(deactivateTestResponse.body.success).toBe(true);
      expect(deactivateTestResponse.body.message).toContain('test');
    });
  });

  describe('Error Recovery Journey', () => {
    test('should handle and recover from various error scenarios', async () => {
      // Step 1: Test network timeout recovery
      const timeoutResponse = await request(API_BASE)
        .get('/api/memories?simulateTimeout=true')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(5000);

      // Should handle timeout gracefully
      expect([200, 408, 504]).toContain(timeoutResponse.status);

      // Step 2: Test invalid data recovery
      const invalidDataResponse = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // Invalid empty title
          content: 'Valid content',
          type: 'text'
        });

      expect(invalidDataResponse.status).toBe(400);
      expect(invalidDataResponse.body.success).toBe(false);

      // Step 3: Test rate limit recovery
      const rateLimitPromises = Array(30).fill(null).map(() =>
        request(API_BASE)
          .get('/api/memories')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const rateLimitResponses = await Promise.all(rateLimitPromises);
      const rateLimitedCount = rateLimitResponses.filter(r => r.status === 429).length;
      
      expect(rateLimitedCount).toBeGreaterThan(0);

      // Step 4: Test session recovery after token expiration
      const expiredTokenResponse = await request(API_BASE)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer expired-token-12345')
        .expect(401);

      expect(expiredTokenResponse.body.success).toBe(false);
      expect(expiredTokenResponse.body.error).toContain('token');
    });
  });
});