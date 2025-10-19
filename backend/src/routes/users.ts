import { FastifyPluginAsync } from 'fastify';

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'users',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'users service is running',
      endpoints: ['GET /health', 'GET /']
    };
  });
};

export default usersRoutes;
