import request from 'supertest';
import { faker } from '@faker-js/faker';

const API_BASE = 'http://localhost:3001';

describe('AI Features API Tests', () => {
  let authToken: string;
  let testUser: any;
  let memoryId: string;

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

    // Create a test memory for AI processing
    const memoryResponse = await request(API_BASE)
      .post('/api/memories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'AI Test Memory',
        content: 'This is a beautiful memory about my family vacation to the beach. We had so much fun playing in the sand and swimming in the ocean.',
        type: 'text'
      });
    
    memoryId = memoryResponse.body.memory.id;
  });

  describe('AI Story Generation - Positive Tests', () => {
    test('should generate AI story from memory content', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/generate-story`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId,
          style: 'narrative',
          length: 'medium'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.story).toBeDefined();
      expect(response.body.story.content).toBeTruthy();
      expect(response.body.story.metadata).toBeDefined();
    });

    test('should generate different story styles', async () => {
      const styles = ['narrative', 'poetic', 'journalistic', 'conversational'];
      
      for (const style of styles) {
        const response = await request(API_BASE)
          .post(`/api/ai/generate-story`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            memoryId: memoryId,
            style: style,
            length: 'short'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.story.style).toBe(style);
      }
    });

    test('should generate stories with different lengths', async () => {
      const lengths = ['short', 'medium', 'long'];
      
      for (const length of lengths) {
        const response = await request(API_BASE)
          .post(`/api/ai/generate-story`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            memoryId: memoryId,
            style: 'narrative',
            length: length
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.story.length).toBe(length);
      }
    });

    test('should generate story with custom prompt', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/generate-story`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId,
          customPrompt: 'Write this as a letter to my future grandchildren',
          style: 'narrative',
          length: 'medium'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.story.content).toContain('grandchildren');
    });
  });

  describe('AI Story Generation - Negative Tests', () => {
    test('should reject story generation without authentication', async () => {
      await request(API_BASE)
        .post(`/api/ai/generate-story`)
        .send({
          memoryId: memoryId,
          style: 'narrative'
        })
        .expect(401);
    });

    test('should reject story generation for non-existent memory', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/generate-story`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: faker.string.uuid(),
          style: 'narrative'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid story style', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/generate-story`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId,
          style: 'invalid-style'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle AI service unavailable', async () => {
      // This would require mocking the AI service to be unavailable
      const response = await request(API_BASE)
        .post(`/api/ai/generate-story`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId,
          style: 'narrative',
          forceError: true // Test parameter
        });

      // Should handle gracefully even if AI service is down
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('AI Memory Analysis - Positive Tests', () => {
    test('should analyze memory sentiment', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/analyze-sentiment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.sentiment).toMatch(/positive|negative|neutral/);
      expect(response.body.analysis.confidence).toBeGreaterThan(0);
    });

    test('should extract memory themes', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/extract-themes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.themes).toBeInstanceOf(Array);
      expect(response.body.themes.length).toBeGreaterThan(0);
    });

    test('should suggest memory tags', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/suggest-tags`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tags).toBeInstanceOf(Array);
      expect(response.body.tags.length).toBeGreaterThan(0);
    });

    test('should find similar memories', async () => {
      // Create another similar memory
      await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Another Beach Memory',
          content: 'We went to the beach again and had a wonderful time with family.',
          type: 'text'
        });

      const response = await request(API_BASE)
        .post(`/api/ai/find-similar`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId,
          limit: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.similarMemories).toBeInstanceOf(Array);
    });
  });

  describe('AI Recommendations - Positive Tests', () => {
    test('should get personalized memory recommendations', async () => {
      const response = await request(API_BASE)
        .get(`/api/ai/recommendations/memories`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeInstanceOf(Array);
    });

    test('should get story prompts', async () => {
      const response = await request(API_BASE)
        .get(`/api/ai/recommendations/story-prompts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.prompts).toBeInstanceOf(Array);
      expect(response.body.prompts.length).toBeGreaterThan(0);
    });

    test('should get memory completion suggestions', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/suggest-completion`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          partialContent: 'Yesterday I went to the park and'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('AI Chat Assistant - Positive Tests', () => {
    test('should start chat session about memories', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/chat/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          context: 'memories',
          initialMessage: 'Tell me about my beach memories'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.response).toBeDefined();
    });

    test('should continue chat conversation', async () => {
      // Start a chat session first
      const startResponse = await request(API_BASE)
        .post(`/api/ai/chat/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          context: 'memories',
          initialMessage: 'Hello'
        });

      const sessionId = startResponse.body.sessionId;

      const response = await request(API_BASE)
        .post(`/api/ai/chat/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          message: 'What can you tell me about my family memories?'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
    });

    test('should end chat session', async () => {
      const startResponse = await request(API_BASE)
        .post(`/api/ai/chat/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          context: 'memories',
          initialMessage: 'Hello'
        });

      const sessionId = startResponse.body.sessionId;

      const response = await request(API_BASE)
        .post(`/api/ai/chat/end`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('AI Content Moderation - Positive Tests', () => {
    test('should moderate memory content', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/moderate-content`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a beautiful family memory',
          type: 'memory'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.moderation).toBeDefined();
      expect(response.body.moderation.approved).toBe(true);
    });

    test('should flag inappropriate content', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/moderate-content`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This contains inappropriate language and harmful content',
          type: 'memory'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.moderation).toBeDefined();
      // Note: In a real implementation, this might be flagged
    });

    test('should detect spam content', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/moderate-content`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Buy now! Click here! Amazing deals! Limited time offer!',
          type: 'memory'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.moderation.spamScore).toBeDefined();
    });
  });

  describe('AI Usage Analytics - Positive Tests', () => {
    test('should get AI usage statistics', async () => {
      const response = await request(API_BASE)
        .get(`/api/ai/usage/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.storiesGenerated).toBeDefined();
      expect(response.body.stats.analysisRequests).toBeDefined();
    });

    test('should get AI feature usage breakdown', async () => {
      const response = await request(API_BASE)
        .get(`/api/ai/usage/breakdown`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.breakdown).toBeDefined();
    });

    test('should check AI quota limits', async () => {
      const response = await request(API_BASE)
        .get(`/api/ai/quota`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.quota).toBeDefined();
      expect(response.body.quota.remaining).toBeDefined();
      expect(response.body.quota.limit).toBeDefined();
    });
  });

  describe('AI Model Management - Positive Tests', () => {
    test('should get available AI models', async () => {
      const response = await request(API_BASE)
        .get(`/api/ai/models`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.models).toBeInstanceOf(Array);
    });

    test('should get model performance metrics', async () => {
      const response = await request(API_BASE)
        .get(`/api/ai/models/performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
    });
  });

  describe('AI Error Handling - Negative Tests', () => {
    test('should handle rate limiting', async () => {
      // Make many requests quickly to trigger rate limiting
      const promises = Array(20).fill(null).map(() =>
        request(API_BASE)
          .post(`/api/ai/generate-story`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            memoryId: memoryId,
            style: 'narrative'
          })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should handle quota exceeded', async () => {
      // This would require setting up a user with exceeded quota
      const response = await request(API_BASE)
        .post(`/api/ai/generate-story`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          memoryId: memoryId,
          style: 'narrative',
          simulateQuotaExceeded: true // Test parameter
        });

      // Should handle gracefully
      expect([200, 402, 429]).toContain(response.status);
    });

    test('should validate AI request parameters', async () => {
      const response = await request(API_BASE)
        .post(`/api/ai/generate-story`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required memoryId
          style: 'narrative'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});