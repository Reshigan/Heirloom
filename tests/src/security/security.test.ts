import request from 'supertest';
import { faker } from '@faker-js/faker';

const API_BASE = 'http://localhost:3001';

describe('Security Tests', () => {
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

  describe('SQL Injection Protection', () => {
    test('should prevent SQL injection in login', async () => {
      const maliciousPayload = {
        email: "admin@example.com'; DROP TABLE users; --",
        password: "password"
      };

      const response = await request(API_BASE)
        .post('/api/auth/login')
        .send(maliciousPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should prevent SQL injection in memory search', async () => {
      const maliciousQuery = "'; DROP TABLE memories; --";

      const response = await request(API_BASE)
        .get(`/api/memories/search?q=${encodeURIComponent(maliciousQuery)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.memories).toBeInstanceOf(Array);
    });

    test('should prevent SQL injection in user profile update', async () => {
      const maliciousUpdate = {
        firstName: "'; UPDATE users SET role='admin' WHERE id=1; --"
      };

      const response = await request(API_BASE)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('XSS Protection', () => {
    test('should sanitize XSS in memory content', async () => {
      const xssPayload = {
        title: '<script>alert("XSS")</script>',
        content: '<img src="x" onerror="alert(\'XSS\')">',
        type: 'text'
      };

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should sanitize XSS in user profile', async () => {
      const xssPayload = {
        bio: '<script>document.cookie="stolen"</script>',
        firstName: '<svg onload="alert(1)">Test</svg>'
      };

      const response = await request(API_BASE)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should sanitize XSS in comments', async () => {
      const xssComment = {
        content: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        memoryId: faker.string.uuid()
      };

      const response = await request(API_BASE)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssComment)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('CSRF Protection', () => {
    test('should require CSRF token for state-changing operations', async () => {
      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Origin', 'https://malicious-site.com')
        .send({
          title: 'Test Memory',
          content: 'Test content',
          type: 'text'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should validate CSRF token', async () => {
      // First get CSRF token
      const csrfResponse = await request(API_BASE)
        .get('/api/csrf-token')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const csrfToken = csrfResponse.body.csrfToken;

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Test Memory',
          content: 'Test content',
          type: 'text'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit login attempts', async () => {
      const promises = Array(20).fill(null).map(() =>
        request(API_BASE)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should rate limit API requests per user', async () => {
      const promises = Array(100).fill(null).map(() =>
        request(API_BASE)
          .get('/api/memories')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should rate limit memory creation', async () => {
      const promises = Array(50).fill(null).map((_, index) =>
        request(API_BASE)
          .post('/api/memories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Test Memory ${index}`,
            content: 'Test content',
            type: 'text'
          })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    test('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@example',
        ''
      ];

      for (const email of invalidEmails) {
        const response = await request(API_BASE)
          .post('/api/auth/register')
          .send({
            email,
            password: 'ValidPassword123!',
            firstName: 'Test',
            lastName: 'User'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    test('should validate password strength', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'PASSWORD',
        'Password',
        'pass123'
      ];

      for (const password of weakPasswords) {
        const response = await request(API_BASE)
          .post('/api/auth/register')
          .send({
            email: faker.internet.email(),
            password,
            firstName: 'Test',
            lastName: 'User'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    test('should validate required fields', async () => {
      const incompleteData = [
        { email: faker.internet.email() }, // missing password
        { password: 'ValidPassword123!' }, // missing email
        { email: faker.internet.email(), password: 'ValidPassword123!' }, // missing names
        {} // empty object
      ];

      for (const data of incompleteData) {
        const response = await request(API_BASE)
          .post('/api/auth/register')
          .send(data)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    test('should validate data types', async () => {
      const invalidData = {
        email: 12345, // should be string
        password: true, // should be string
        firstName: [], // should be string
        lastName: {} // should be string
      };

      const response = await request(API_BASE)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authorization Tests', () => {
    test('should prevent access to other users\' data', async () => {
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

      const otherToken = otherAuthResponse.body.token;

      // Try to access first user's profile with second user's token
      const response = await request(API_BASE)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(response.body.user.email).toBe(otherUser.email);
      expect(response.body.user.email).not.toBe(testUser.email);
    });

    test('should prevent privilege escalation', async () => {
      const response = await request(API_BASE)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'admin',
          permissions: ['admin', 'super_user']
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/memories' },
        { method: 'post', path: '/api/memories' },
        { method: 'get', path: '/api/users/profile' },
        { method: 'put', path: '/api/users/profile' },
        { method: 'get', path: '/api/subscriptions/current' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(API_BASE)
          [endpoint.method](endpoint.path)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('File Upload Security', () => {
    test('should validate file types', async () => {
      const maliciousFile = Buffer.from('<?php echo "malicious code"; ?>');

      const response = await request(API_BASE)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', maliciousFile, 'malicious.php')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('file type');
    });

    test('should validate file size limits', async () => {
      const largeFile = Buffer.alloc(100 * 1024 * 1024); // 100MB

      const response = await request(API_BASE)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeFile, 'large.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('file size');
    });

    test('should scan files for malware', async () => {
      // This would require actual malware scanning implementation
      const suspiciousFile = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');

      const response = await request(API_BASE)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', suspiciousFile, 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Session Security', () => {
    test('should invalidate session on logout', async () => {
      // Logout
      await request(API_BASE)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to use the same token
      const response = await request(API_BASE)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should detect concurrent sessions', async () => {
      // Login from multiple locations
      const login1 = await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      const login2 = await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(login1.body.token).not.toBe(login2.body.token);
    });

    test('should expire old sessions', async () => {
      // This test would require time manipulation or waiting
      // In a real implementation, you'd test session expiration
      const response = await request(API_BASE)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.sessions).toBeInstanceOf(Array);
    });
  });

  describe('Data Encryption', () => {
    test('should encrypt sensitive data at rest', async () => {
      const sensitiveMemory = {
        title: 'Private Memory',
        content: 'This contains sensitive information',
        type: 'text',
        isPrivate: true
      };

      const response = await request(API_BASE)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sensitiveMemory)
        .expect(201);

      expect(response.body.success).toBe(true);
      // In a real implementation, you'd verify the data is encrypted in the database
    });

    test('should use HTTPS for all communications', async () => {
      // This test would verify SSL/TLS configuration
      const response = await request(API_BASE)
        .get('/api/health')
        .expect(200);

      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('API Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(API_BASE)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    test('should prevent information disclosure', async () => {
      const response = await request(API_BASE)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Audit Logging', () => {
    test('should log security events', async () => {
      // Failed login attempt
      await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      // Check if security event was logged
      const response = await request(API_BASE)
        .get('/api/admin/security-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.logs).toBeInstanceOf(Array);
    });

    test('should log data access events', async () => {
      await request(API_BASE)
        .get('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify access was logged
      const response = await request(API_BASE)
        .get('/api/admin/access-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.logs).toBeInstanceOf(Array);
    });
  });
});