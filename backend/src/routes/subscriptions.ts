import { FastifyPluginAsync } from 'fastify';

const subscriptionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'subscriptions',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'subscriptions service is running',
      endpoints: ['GET /health', 'GET /']
    };
  });
};

export default subscriptionsRoutes;
