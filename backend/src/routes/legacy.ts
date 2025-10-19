import { FastifyPluginAsync } from 'fastify';

const legacyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'legacy',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'legacy service is running',
      endpoints: ['GET /health', 'GET /']
    };
  });
};

export default legacyRoutes;
