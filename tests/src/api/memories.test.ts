import request from 'supertest';
import { faker } from '@faker-js/faker';

const API_BASE = 'http://localhost:3001';

describe('Memories API Tests', () => {
  let authToken: string;
  let testUser: any;
  let memoryId: string;

  beforeAll(async () => {
    // Create test user and get auth token
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

  describe('Create Memory - Positive Tests', () => {
    test('should create a text memory successfully', async () => {
      const memory = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(3),
        type: 'text',
        tags: [faker.word.noun(), faker.word.noun()],
        isPublic: false,
        location: faker.location.city()
      };

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memory)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.memory.title).toBe(memory.title);
      expect(response.body.memory.type).toBe('text');
      memoryId = response.body.memory.id;
    });

    test('should create a photo memory with metadata', async () => {
      const memory = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        type: 'photo',
        mediaUrl: faker.image.url(),
        metadata: {
          camera: 'iPhone 15 Pro',
          location: faker.location.city(),
          timestamp: new Date().toISOString()
        }
      };

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memory)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.memory.type).toBe('photo');
      expect(response.body.memory.metadata.camera).toBe('iPhone 15 Pro');
    });

    test('should create a video memory', async () => {
      const memory = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        type: 'video',
        mediaUrl: faker.internet.url(),
        duration: 120,
        thumbnail: faker.image.url()
      };

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memory)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.memory.type).toBe('video');
      expect(response.body.memory.duration).toBe(120);
    });

    test('should create memory with AI-generated story', async () => {
      const memory = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        type: 'text',
        generateAIStory: true
      };

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memory)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.memory.aiStory).toBeDefined();
    });
  });

  describe('Create Memory - Negative Tests', () => {
    test('should reject memory without authentication', async () => {
      const memory = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        type: 'text'
      };

      await request(API_BASE)
        .post('/api/memories')
        .send(memory)
        .expect(401);
    });

    test('should reject memory with invalid type', async () => {
      const memory = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        type: 'invalid-type'
      };

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memory)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject memory without required fields', async () => {
      const memory = {
        content: faker.lorem.paragraph()
      };

      await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memory)
        .expect(400);
    });

    test('should reject memory with XSS attempt', async () => {
      const memory = {
        title: '<script>alert("xss")</script>',
        content: faker.lorem.paragraph(),
        type: 'text'
      };

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memory)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject memory with excessive content length', async () => {
      const memory = {
        title: faker.lorem.sentence(),
        content: 'a'.repeat(100000), // 100KB of content
        type: 'text'
      };

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memory)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Get Memories - Positive Tests', () => {
    test('should get user memories with pagination', async () => {
      const response = await request(API_BASE)
        .get('/api/memories?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.memories).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    test('should get memories with filtering by type', async () => {
      const response = await request(API_BASE)
        .get('/api/memories?type=text')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.memories.forEach((memory: any) => {
        expect(memory.type).toBe('text');
      });
    });

    test('should get memories with date range filter', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(API_BASE)
        .get(`/api/memories?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should search memories by content', async () => {
      const response = await request(API_BASE)
        .get('/api/memories/search?q=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.memories).toBeInstanceOf(Array);
    });
  });

  describe('Get Single Memory - Positive Tests', () => {
    test('should get memory by ID', async () => {
      const response = await request(API_BASE)
        .get(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.memory.id).toBe(memoryId);
    });

    test('should get memory with AI insights', async () => {
      const response = await request(API_BASE)
        .get(`/api/memories/${memoryId}?includeAI=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.memory.aiInsights).toBeDefined();
    });
  });

  describe('Get Single Memory - Negative Tests', () => {
    test('should return 404 for non-existent memory', async () => {
      const fakeId = faker.string.uuid();
      
      await request(API_BASE)
        .get(`/api/memories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should reject access to other user\'s private memory', async () => {
      // Create another user
      const otherUser = {
        email: faker.internet.email(),
        password: faker.internet.password({ length: 12 }),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName()
      };

      const otherAuthResponse = await request(API_BASE)
        .post('/api/auth/register')
        .send(otherUser);

      await request(API_BASE)
        .get(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${otherAuthResponse.body.token}`)
        .expect(403);
    });
  });

  describe('Update Memory - Positive Tests', () => {
    test('should update memory title and content', async () => {
      const updates = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2)
      };

      const response = await request(API_BASE)
        .put(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.memory.title).toBe(updates.title);
    });

    test('should update memory tags', async () => {
      const updates = {
        tags: ['family', 'vacation', 'summer']
      };

      const response = await request(API_BASE)
        .put(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.memory.tags).toEqual(updates.tags);
    });

    test('should update memory privacy settings', async () => {
      const updates = {
        isPublic: true,
        shareSettings: {
          allowComments: true,
          allowSharing: false
        }
      };

      const response = await request(API_BASE)
        .put(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.memory.isPublic).toBe(true);
    });
  });

  describe('Update Memory - Negative Tests', () => {
    test('should reject update without authentication', async () => {
      const updates = { title: faker.lorem.sentence() };

      await request(API_BASE)
        .put(`/api/memories/${memoryId}`)
        .send(updates)
        .expect(401);
    });

    test('should reject update of non-existent memory', async () => {
      const fakeId = faker.string.uuid();
      const updates = { title: faker.lorem.sentence() };

      await request(API_BASE)
        .put(`/api/memories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(404);
    });

    test('should reject update with invalid data', async () => {
      const updates = {
        type: 'invalid-type'
      };

      const response = await request(API_BASE)
        .put(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Delete Memory - Positive Tests', () => {
    test('should soft delete memory', async () => {
      const response = await request(API_BASE)
        .delete(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should not return deleted memory in listings', async () => {
      const response = await request(API_BASE)
        .get('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedMemory = response.body.memories.find((m: any) => m.id === memoryId);
      expect(deletedMemory).toBeUndefined();
    });
  });

  describe('Delete Memory - Negative Tests', () => {
    test('should reject delete without authentication', async () => {
      await request(API_BASE)
        .delete(`/api/memories/${memoryId}`)
        .expect(401);
    });

    test('should return 404 for already deleted memory', async () => {
      await request(API_BASE)
        .delete(`/api/memories/${memoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Memory Analytics - Positive Tests', () => {
    test('should get memory analytics', async () => {
      const response = await request(API_BASE)
        .get('/api/memories/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('totalMemories');
      expect(response.body.analytics).toHaveProperty('memoryTypes');
      expect(response.body.analytics).toHaveProperty('monthlyStats');
    });

    test('should get memory trends', async () => {
      const response = await request(API_BASE)
        .get('/api/memories/trends?period=30d')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trends).toBeDefined();
    });
  });
});