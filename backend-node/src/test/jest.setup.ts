import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrismaClient: any = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    vault: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    vaultItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    comment: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    highlight: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    timeCapsule: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    checkIn: {
      updateMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  mockPrismaClient.$transaction = jest.fn(async (callback: any) => {
    return callback(mockPrismaClient);
  });

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/heirloom_test';

jest.setTimeout(10000);
