import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

const prisma = new PrismaClient();

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        salt: 'salt123',
        status: 'alive',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockVault = {
        id: 'vault-123',
        userId: 'user-123',
        vmkSalt: 'vmk-salt-123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.vault.create as jest.Mock).mockResolvedValue(mockVault);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('vmkSalt');
    });

    it('should return 400 if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already registered');
    });

    it('should return 400 if password is too weak', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const password = 'Password123!';
      const passwordHash = await bcrypt.hash(password, 10);

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash,
        salt: 'salt123',
        status: 'alive',
      };

      const mockVault = {
        vmkSalt: 'vmk-salt-123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.vault.findUnique as jest.Mock).mockResolvedValue(mockVault);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('vmkSalt');
    });

    it('should return 401 with incorrect password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('CorrectPassword123!', 10),
        salt: 'salt123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});
