import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { config } from './utils/config';

// Initialize Prisma
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Initialize Fastify server
const server = Fastify({
  logger: logger,
});

// CORS
server.register(cors, {
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

// Health check endpoint
server.get('/health', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
      },
    };
  } catch (error) {
    logger.error('Health check failed:', error);
    return reply.status(503).send({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Basic route
server.get('/', async (request, reply) => {
  return { 
    message: 'Loominary API - World\'s First Private Vault System',
    version: '1.0.0',
    status: 'running'
  };
});

// Start server
async function start() {
  try {
    const address = await server.listen({
      port: config.server.port,
      host: config.server.host,
    });
    
    logger.info(`🚀 Loominary server running at ${address}`);
    logger.info(`🌟 Building the future of legacy preservation...`);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default server;