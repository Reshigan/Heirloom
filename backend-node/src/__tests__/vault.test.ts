import request from 'supertest';
import express from 'express';
import vaultRoutes from '../routes/vault';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/vault', vaultRoutes);

const prisma = new PrismaClient();

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key', {
    expiresIn: '7d',
  });
};

describe('Vault Routes', () => {
  const userId = 'user-123';
  const token = generateToken(userId);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /vault/items', () => {
    it('should return vault items for authenticated user', async () => {
      const mockItems = [
        {
          id: 'item-1',
          vaultId: 'vault-123',
          type: 'photo',
          title: 'Test Photo',
          description: 'A test photo',
          visibility: 'PRIVATE',
          createdAt: new Date(),
        },
        {
          id: 'item-2',
          vaultId: 'vault-123',
          type: 'video',
          title: 'Test Video',
          description: 'A test video',
          visibility: 'POSTHUMOUS',
          createdAt: new Date(),
        },
      ];

      (prisma.vault.findUnique as jest.Mock).mockResolvedValue({
        id: 'vault-123',
        userId,
      });
      (prisma.vaultItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const response = await request(app)
        .get('/vault/items')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Test Photo');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/vault/items');

      expect(response.status).toBe(401);
    });

    it('should filter by visibility', async () => {
      const mockItems = [
        {
          id: 'item-1',
          vaultId: 'vault-123',
          type: 'photo',
          visibility: 'PRIVATE',
          createdAt: new Date(),
        },
      ];

      (prisma.vault.findUnique as jest.Mock).mockResolvedValue({
        id: 'vault-123',
        userId,
      });
      (prisma.vaultItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const response = await request(app)
        .get('/vault/items?visibility=PRIVATE')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(prisma.vaultItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visibility: 'PRIVATE',
          }),
        })
      );
    });
  });

  describe('POST /vault/items', () => {
    it('should create a new vault item', async () => {
      const newItem = {
        type: 'photo',
        title: 'New Photo',
        description: 'A new photo',
        visibility: 'PRIVATE',
        encryptedData: 'encrypted-data',
      };

      const mockVault = {
        id: 'vault-123',
        userId,
        uploadCountThisWeek: 0,
        uploadLimitWeekly: 3,
      };

      const mockCreatedItem = {
        id: 'item-new',
        vaultId: 'vault-123',
        ...newItem,
        createdAt: new Date(),
      };

      (prisma.vault.findUnique as jest.Mock).mockResolvedValue(mockVault);
      (prisma.vaultItem.create as jest.Mock).mockResolvedValue(mockCreatedItem);

      const response = await request(app)
        .post('/vault/items')
        .set('Authorization', `Bearer ${token}`)
        .send(newItem);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Photo');
    });

    it('should return 429 if upload limit exceeded', async () => {
      const mockVault = {
        id: 'vault-123',
        userId,
        uploadCountThisWeek: 3,
        uploadLimitWeekly: 3,
      };

      (prisma.vault.findUnique as jest.Mock).mockResolvedValue(mockVault);

      const response = await request(app)
        .post('/vault/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'photo',
          title: 'New Photo',
          encryptedData: 'encrypted-data',
        });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Upload limit');
    });
  });

  describe('DELETE /vault/items/:id', () => {
    it('should delete a vault item', async () => {
      const itemId = 'item-123';

      const mockItem = {
        id: itemId,
        vaultId: 'vault-123',
        vault: {
          userId,
        },
      };

      (prisma.vaultItem.findUnique as jest.Mock).mockResolvedValue(mockItem);
      (prisma.vaultItem.delete as jest.Mock).mockResolvedValue(mockItem);

      const response = await request(app)
        .delete(`/vault/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Item deleted successfully');
    });

    it('should return 404 if item not found', async () => {
      (prisma.vaultItem.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/vault/items/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
