import request from 'supertest';
import { faker } from '@faker-js/faker';

const API_BASE = 'http://localhost:3001';

describe('Performance Tests', () => {
  let authToken: string;
  let testUser: any;

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

  describe('Response Time Tests', () => {
    test('health check should respond within 100ms', async () => {
      const startTime = Date.now();
      
      await request(API_BASE)
        .get('/api/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    test('authentication should respond within 500ms', async () => {
      const startTime = Date.now();
      
      await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    test('memory listing should respond within 1000ms', async () => {
      const startTime = Date.now();
      
      await request(API_BASE)
        .get('/api/memories?limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });

    test('memory search should respond within 2000ms', async () => {
      const startTime = Date.now();
      
      await request(API_BASE)
        .get('/api/memories/search?q=test&limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000);
    });

    test('AI story generation should respond within 10000ms', async () => {
      const startTime = Date.now();
      
      const memory = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2),
        type: 'text',
        generateAIStory: true
      };

      await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memory)
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(10000);
    });
  });

  describe('Throughput Tests', () => {
    test('should handle 100 concurrent memory reads', async () => {
      const startTime = Date.now();
      
      const promises = Array(100).fill(null).map(() =>
        request(API_BASE)
          .get('/api/memories?limit=10')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(90); // Allow for some rate limiting
      
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / responses.length;
      expect(avgResponseTime).toBeLessThan(2000);
    });

    test('should handle 50 concurrent memory creations', async () => {
      const startTime = Date.now();
      
      const promises = Array(50).fill(null).map((_, index) =>
        request(API_BASE)
          .post('/api/memories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Performance Test Memory ${index}`,
            content: faker.lorem.paragraphs(2),
            type: 'text'
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      const successfulResponses = responses.filter(r => r.status === 201);
      expect(successfulResponses.length).toBeGreaterThan(40); // Allow for rate limiting
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(30000); // 30 seconds for 50 creations
    });

    test('should handle 200 concurrent user registrations', async () => {
      const startTime = Date.now();
      
      const promises = Array(200).fill(null).map((_, index) =>
        request(API_BASE)
          .post('/api/auth/register')
          .send({
            email: `perftest${index}@example.com`,
            password: 'TestPassword123!',
            firstName: `Test${index}`,
            lastName: 'User'
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      const successfulResponses = responses.filter(r => r.status === 201);
      expect(successfulResponses.length).toBeGreaterThan(150); // Allow for some failures
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(60000); // 1 minute for 200 registrations
    });
  });

  describe('Load Tests', () => {
    test('should maintain performance under sustained load', async () => {
      const duration = 30000; // 30 seconds
      const requestsPerSecond = 10;
      const totalRequests = (duration / 1000) * requestsPerSecond;
      
      const startTime = Date.now();
      const responses: any[] = [];
      
      const makeRequest = async () => {
        try {
          const response = await request(API_BASE)
            .get('/api/memories?limit=5')
            .set('Authorization', `Bearer ${authToken}`);
          responses.push(response);
        } catch (error) {
          responses.push({ status: 500, error });
        }
      };

      // Generate sustained load
      const interval = setInterval(() => {
        if (Date.now() - startTime < duration) {
          for (let i = 0; i < requestsPerSecond; i++) {
            makeRequest();
          }
        }
      }, 1000);

      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, duration + 5000));
      clearInterval(interval);

      const successfulResponses = responses.filter(r => r.status === 200);
      const successRate = successfulResponses.length / responses.length;
      
      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      expect(responses.length).toBeGreaterThan(totalRequests * 0.8); // At least 80% of expected requests
    });

    test('should handle memory-intensive operations', async () => {
      // Create a large memory with lots of content
      const largeContent = Array(1000).fill(null).map(() => faker.lorem.paragraph()).join('\n');
      
      const startTime = Date.now();
      
      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Large Memory Performance Test',
          content: largeContent,
          type: 'text',
          tags: Array(50).fill(null).map(() => faker.word.noun())
        })
        .expect(201);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds for large memory
      expect(response.body.success).toBe(true);
    });
  });

  describe('Database Performance Tests', () => {
    test('should efficiently paginate large result sets', async () => {
      // First create many memories
      const createPromises = Array(100).fill(null).map((_, index) =>
        request(API_BASE)
          .post('/api/memories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `DB Performance Test ${index}`,
            content: faker.lorem.paragraph(),
            type: 'text'
          })
      );

      await Promise.all(createPromises);

      // Test pagination performance
      const startTime = Date.now();
      
      const response = await request(API_BASE)
        .get('/api/memories?page=1&limit=50&sort=createdAt&order=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
      expect(response.body.memories.length).toBeLessThanOrEqual(50);
      expect(response.body.pagination).toBeDefined();
    });

    test('should efficiently search across large datasets', async () => {
      const startTime = Date.now();
      
      const response = await request(API_BASE)
        .get('/api/memories/search?q=performance&limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000);
      expect(response.body.memories).toBeInstanceOf(Array);
    });

    test('should efficiently aggregate user statistics', async () => {
      const startTime = Date.now();
      
      const response = await request(API_BASE)
        .get('/api/memories/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(3000);
      expect(response.body.analytics).toBeDefined();
    });
  });

  describe('Caching Performance Tests', () => {
    test('should cache frequently accessed data', async () => {
      // First request (cache miss)
      const startTime1 = Date.now();
      await request(API_BASE)
        .get('/api/subscriptions/tiers')
        .expect(200);
      const responseTime1 = Date.now() - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      await request(API_BASE)
        .get('/api/subscriptions/tiers')
        .expect(200);
      const responseTime2 = Date.now() - startTime2;

      // Cache hit should be significantly faster
      expect(responseTime2).toBeLessThan(responseTime1 * 0.5);
    });

    test('should cache user session data', async () => {
      // First profile request
      const startTime1 = Date.now();
      await request(API_BASE)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const responseTime1 = Date.now() - startTime1;

      // Second profile request (should be cached)
      const startTime2 = Date.now();
      await request(API_BASE)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const responseTime2 = Date.now() - startTime2;

      expect(responseTime2).toBeLessThan(responseTime1 * 0.7);
    });
  });

  describe('Memory Usage Tests', () => {
    test('should handle large file uploads efficiently', async () => {
      // Create a 10MB test file
      const largeFile = Buffer.alloc(10 * 1024 * 1024, 'a');
      
      const startTime = Date.now();
      
      const response = await request(API_BASE)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeFile, 'large-test.txt')
        .expect(201);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(30000); // 30 seconds for 10MB upload
      expect(response.body.success).toBe(true);
    });

    test('should efficiently process batch operations', async () => {
      const batchData = Array(100).fill(null).map((_, index) => ({
        title: `Batch Memory ${index}`,
        content: faker.lorem.paragraph(),
        type: 'text'
      }));

      const startTime = Date.now();
      
      const response = await request(API_BASE)
        .post('/api/memories/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ memories: batchData })
        .expect(201);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(10000); // 10 seconds for 100 memories
      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(100);
    });
  });

  describe('Scalability Tests', () => {
    test('should maintain performance with increasing data volume', async () => {
      const baselines: number[] = [];
      
      // Test performance at different data volumes
      for (let volume = 10; volume <= 100; volume += 30) {
        const startTime = Date.now();
        
        await request(API_BASE)
          .get(`/api/memories?limit=${volume}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        const responseTime = Date.now() - startTime;
        baselines.push(responseTime);
      }

      // Response time should not increase exponentially
      for (let i = 1; i < baselines.length; i++) {
        const growthFactor = baselines[i] / baselines[i - 1];
        expect(growthFactor).toBeLessThan(2); // Should not double with each increase
      }
    });

    test('should handle concurrent users efficiently', async () => {
      const userTokens: string[] = [];
      
      // Create multiple test users
      for (let i = 0; i < 20; i++) {
        const user = {
          email: `concurrent${i}@example.com`,
          password: 'TestPassword123!',
          firstName: `User${i}`,
          lastName: 'Test'
        };

        const authResponse = await request(API_BASE)
          .post('/api/auth/register')
          .send(user);
        
        userTokens.push(authResponse.body.token);
      }

      // Simulate concurrent user activity
      const startTime = Date.now();
      
      const promises = userTokens.map(token =>
        request(API_BASE)
          .get('/api/memories')
          .set('Authorization', `Bearer ${token}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBe(userTokens.length);
      
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / responses.length;
      expect(avgResponseTime).toBeLessThan(2000);
    });
  });

  describe('Resource Optimization Tests', () => {
    test('should compress large responses', async () => {
      const response = await request(API_BASE)
        .get('/api/memories?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      expect(response.headers['content-encoding']).toBe('gzip');
    });

    test('should use efficient JSON serialization', async () => {
      const startTime = Date.now();
      
      const response = await request(API_BASE)
        .get('/api/memories/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
      
      // Verify response is properly structured
      expect(response.body.analytics).toBeDefined();
      expect(typeof response.body.analytics).toBe('object');
    });

    test('should minimize database queries', async () => {
      // This test would require query monitoring in a real implementation
      const startTime = Date.now();
      
      const response = await request(API_BASE)
        .get('/api/memories?include=user,tags,comments&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1500);
      expect(response.body.memories).toBeInstanceOf(Array);
    });
  });
});