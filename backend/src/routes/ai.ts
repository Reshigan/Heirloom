import { FastifyPluginAsync } from 'fastify';

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'ai',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'ai service is running',
      endpoints: ['GET /health', 'GET /']
    };
  });
};

export default aiRoutes;
