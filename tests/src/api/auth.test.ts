import request from 'supertest';
import { faker } from '@faker-js/faker';

const API_BASE = 'http://localhost:3001';

describe('Authentication API Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(() => {
    testUser = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' })
    };
  });

  describe('User Registration - Positive Tests', () => {
    test('should register a new user successfully', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
      authToken = response.body.token;
    });

    test('should register user with minimum required fields', async () => {
      const minUser = {
        email: faker.internet.email(),
        password: 'Password123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName()
      };

      const response = await request(API_BASE)
        .post('/api/auth/register')
        .send(minUser)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should register user with all optional fields', async () => {
      const fullUser = {
        email: faker.internet.email(),
        password: 'Password123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        dateOfBirth: faker.date.birthdate(),
        phoneNumber: faker.phone.number(),
        bio: faker.lorem.paragraph(),
        location: faker.location.city()
      };

      const response = await request(API_BASE)
        .post('/api/auth/register')
        .send(fullUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.bio).toBe(fullUser.bio);
    });
  });

  describe('User Registration - Negative Tests', () => {
    test('should reject registration with duplicate email', async () => {
      await request(API_BASE)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);
    });

    test('should reject registration with invalid email format', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };
      
      const response = await request(API_BASE)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    test('should reject registration with weak password', async () => {
      const weakPasswordUser = { ...testUser, email: faker.internet.email(), password: '123' };
      
      const response = await request(API_BASE)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('password');
    });

    test('should reject registration with missing required fields', async () => {
      const incompleteUser = { email: faker.internet.email() };
      
      await request(API_BASE)
        .post('/api/auth/register')
        .send(incompleteUser)
        .expect(400);
    });

    test('should reject registration with SQL injection attempt', async () => {
      const maliciousUser = {
        ...testUser,
        email: faker.internet.email(),
        firstName: "'; DROP TABLE users; --"
      };
      
      const response = await request(API_BASE)
        .post('/api/auth/register')
        .send(maliciousUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('User Login - Positive Tests', () => {
    test('should login with valid credentials', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    test('should login with email case insensitive', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('User Login - Negative Tests', () => {
    test('should reject login with invalid email', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject login with invalid password', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject login with missing credentials', async () => {
      await request(API_BASE)
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });

    test('should handle brute force protection', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(API_BASE)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword'
          })
      );

      await Promise.all(promises);

      const response = await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBeGreaterThanOrEqual(429);
    });
  });

  describe('Token Validation - Positive Tests', () => {
    test('should validate valid JWT token', async () => {
      const response = await request(API_BASE)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(testUser.email);
    });

    test('should refresh valid token', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.success).toBe(true);
    });
  });

  describe('Token Validation - Negative Tests', () => {
    test('should reject invalid JWT token', async () => {
      const response = await request(API_BASE)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject expired JWT token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      const response = await request(API_BASE)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject request without authorization header', async () => {
      await request(API_BASE)
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('Password Reset - Positive Tests', () => {
    test('should initiate password reset', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset');
    });

    test('should handle password reset for non-existent email gracefully', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Logout - Positive Tests', () => {
    test('should logout successfully', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should invalidate token after logout', async () => {
      await request(API_BASE)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });
});