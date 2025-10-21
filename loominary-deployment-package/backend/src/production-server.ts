import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ 
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register CORS
await fastify.register(cors, {
  origin: ['http://localhost:12000', 'https://loominary.app'],
  credentials: true
});

// Health check route
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Loominary Backend API',
    version: '1.0.0'
  };
});

// API info route
fastify.get('/api/info', async (request, reply) => {
  return {
    name: 'Loominary API',
    version: '1.0.0',
    description: 'World\'s First Private Vault System',
    status: 'production',
    features: [
      'Private Vault System',
      'Inheritance Tokens',
      'AI Story Generation',
      'Family Legacy Planning',
      'Secure Memory Storage'
    ]
  };
});

// Basic auth routes placeholder
fastify.post('/api/auth/login', async (request, reply) => {
  return { 
    message: 'Login endpoint - implementation in progress',
    status: 'placeholder'
  };
});

fastify.post('/api/auth/register', async (request, reply) => {
  return { 
    message: 'Register endpoint - implementation in progress',
    status: 'placeholder'
  };
});

// Vault routes placeholder
fastify.get('/api/vault', async (request, reply) => {
  return { 
    message: 'Vault endpoint - implementation in progress',
    status: 'placeholder',
    vaults: []
  };
});

// AI routes placeholder
fastify.post('/api/ai/generate-story', async (request, reply) => {
  return { 
    message: 'AI Story Generation - implementation in progress',
    status: 'placeholder',
    story: 'Your AI-generated story will appear here...'
  };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log('🌟 LOOMINARY BACKEND API STARTED 🌟');
    console.log('=====================================');
    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log('🏛️ World\'s First Private Vault System');
    console.log('💎 Building Legacy for Future Generations');
    console.log('=====================================');
    console.log(`📊 Health Check: http://${host}:${port}/health`);
    console.log(`📋 API Info: http://${host}:${port}/api/info`);
    console.log('=====================================');
    
  } catch (err) {
    console.error('❌ Error starting Loominary backend:', err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start();