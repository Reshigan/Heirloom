import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const server = Fastify({
  logger: true,
});

// CORS
server.register(cors, {
  origin: true,
  credentials: true,
});

// Health check
server.get('/health', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  } catch (error) {
    return reply.status(503).send({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// Basic route
server.get('/', async (request, reply) => {
  return { message: 'Loominary API is running!' };
});

// Start server
async function start() {
  try {
    const address = await server.listen({
      port: 3001,
      host: '0.0.0.0',
    });
    console.log(`🚀 Test server running at ${address}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();