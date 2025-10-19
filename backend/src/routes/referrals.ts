import { FastifyPluginAsync } from 'fastify';

const referralsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'referrals',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/', async (request, reply) => {
    return { 
      message: 'referrals service is running',
      endpoints: ['GET /health', 'GET /']
    };
  });
};

export default referralsRoutes;
