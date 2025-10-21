import { FastifyPluginAsync } from 'fastify';

const memoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'memories',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'memories service is running',
      endpoints: ['GET /health', 'GET /']
    };
  });
};

export default memoriesRoutes;
