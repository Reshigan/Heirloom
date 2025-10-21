import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from './utils/logger';
import { config } from './utils/config';

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import familyRoutes from './routes/families';
import memoryRoutes from './routes/memories';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notifications';
import referralRoutes from './routes/referrals';
import subscriptionRoutes from './routes/subscriptions';
import timeCapsuleRoutes from './routes/timeCapsules';
import legacyRoutes from './routes/legacy';
import analyticsRoutes from './routes/analytics';

// Services
import { NotificationService } from './services/NotificationService';
import { AIService } from './services/AIService';
import { ReferralService } from './services/ReferralService';
import { WebSocketService } from './services/WebSocketService';

// Initialize database and cache
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Redis connection (optional for development)
let redis: Redis | null = null;
try {
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  
  redis.on('error', (err) => {
    logger.warn('Redis connection failed, running without cache:', err.message);
    redis = null;
  });
  
  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });
} catch (error) {
  logger.warn('Redis not available, running without cache');
  redis = null;
}

// Initialize Fastify server
const server = Fastify({
  logger: logger,
  trustProxy: true,
  bodyLimit: 50 * 1024 * 1024, // 50MB for media uploads
});

// Global error handler
server.setErrorHandler(async (error, request, reply) => {
  logger.error('Global error handler:', error);
  
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
  }
  
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
  }
  
  // Log unexpected errors
  logger.error('Unexpected error:', error);
  
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
});

// Register plugins
async function registerPlugins() {
  // CORS
  await server.register(cors, {
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: redis,
  });

  // JWT authentication
  await server.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  // File uploads
  await server.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });

  // WebSocket support
  await server.register(websocket);

  // API documentation
  await server.register(swagger, {
    swagger: {
      info: {
        title: 'Loominary API',
        description: 'Revolutionary legacy platform API for future generations',
        version: '1.0.0',
      },
      host: config.server.host,
      schemes: ['https', 'http'],
      consumes: ['application/json', 'multipart/form-data'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}

// Authentication middleware
server.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Add database and cache to request context
server.decorateRequest('prisma', null);
server.decorateRequest('redis', null);

server.addHook('onRequest', async (request) => {
  request.prisma = prisma;
  request.redis = redis;
});

// Initialize services
const notificationService = new NotificationService(prisma, redis);
const aiService = new AIService(prisma, redis);
const referralService = new ReferralService(prisma, redis);
const webSocketService = new WebSocketService(server, prisma, redis);

// Add services to request context
server.decorateRequest('notificationService', null);
server.decorateRequest('aiService', null);
server.decorateRequest('referralService', null);

server.addHook('onRequest', async (request) => {
  request.notificationService = notificationService;
  request.aiService = aiService;
  request.referralService = referralService;
});

// Health check endpoint
server.get('/health', async (request, reply) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    let cacheStatus = 'disconnected';
    if (redis) {
      try {
        await redis.ping();
        cacheStatus = 'connected';
      } catch (redisError) {
        logger.warn('Redis health check failed:', redisError);
      }
    }
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        cache: cacheStatus,
        ai: aiService.isHealthy() ? 'connected' : 'disconnected',
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

// Register routes
async function registerRoutes() {
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(userRoutes, { prefix: '/api/users' });
  await server.register(familyRoutes, { prefix: '/api/families' });
  await server.register(memoryRoutes, { prefix: '/api/memories' });
  await server.register(aiRoutes, { prefix: '/api/ai' });
  await server.register(notificationRoutes, { prefix: '/api/notifications' });
  await server.register(referralRoutes, { prefix: '/api/referrals' });
  await server.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
  await server.register(timeCapsuleRoutes, { prefix: '/api/time-capsules' });
  await server.register(legacyRoutes, { prefix: '/api/legacy' });
  await server.register(analyticsRoutes, { prefix: '/api/analytics' });
}

// WebSocket routes
server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    webSocketService.handleConnection(connection, req);
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await server.close();
    await prisma.$disconnect();
    if (redis) {
      await redis.quit();
    }
    logger.info('Server shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    
    // Start background services
    await notificationService.start();
    await aiService.start();
    
    const address = await server.listen({
      port: config.server.port,
      host: config.server.host,
    });
    
    logger.info(`🚀 Loominary server running at ${address}`);
    logger.info(`📚 API documentation available at ${address}/docs`);
    logger.info(`🌟 Building the future of legacy preservation...`);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

start();

export default server;