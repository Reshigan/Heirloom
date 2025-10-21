import { FastifyPluginAsync } from 'fastify';

const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'notifications',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'notifications service is running',
      endpoints: ['GET /health', 'GET /']
    };
  });
};

export default notificationsRoutes;
