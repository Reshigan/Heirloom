import { FastifyPluginAsync } from 'fastify';

const familiesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'families',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'families service is running',
      endpoints: ['GET /health', 'GET /']
    };
  });
};

export default familiesRoutes;
