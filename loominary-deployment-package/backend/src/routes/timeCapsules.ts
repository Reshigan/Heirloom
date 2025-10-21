import { FastifyPluginAsync } from 'fastify';

const timeCapsulesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'timeCapsules',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'timeCapsules service is running',
      endpoints: ['GET /health', 'GET /']
    };
  });
};

export default timeCapsulesRoutes;
