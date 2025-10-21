import { FastifyPluginAsync } from 'fastify';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check for auth service
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'auth',
      timestamp: new Date().toISOString()
    };
  });

  // Login endpoint (simplified for demo)
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };
    
    // This is a demo implementation - in production, you'd validate against the database
    if (email && password) {
      const token = await reply.jwtSign({ 
        email,
        id: 'demo-user-id',
        role: 'user'
      });
      
      return {
        success: true,
        token,
        user: {
          id: 'demo-user-id',
          email,
          firstName: 'Demo',
          lastName: 'User'
        }
      };
    }
    
    return reply.status(401).send({
      success: false,
      message: 'Invalid credentials'
    });
  });

  // Register endpoint (simplified for demo)
  fastify.post('/register', async (request, reply) => {
    const { email, password, firstName, lastName } = request.body as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    };
    
    if (email && password && firstName && lastName) {
      const token = await reply.jwtSign({ 
        email,
        id: 'new-user-id',
        role: 'user'
      });
      
      return {
        success: true,
        token,
        user: {
          id: 'new-user-id',
          email,
          firstName,
          lastName
        }
      };
    }
    
    return reply.status(400).send({
      success: false,
      message: 'Missing required fields'
    });
  });

  // Protected route example
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    return {
      user: request.user,
      message: 'This is a protected route'
    };
  });
};

export default authRoutes;