const fastify = require('fastify')({ logger: true });

// Simple health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Simple server running on http://localhost:3001');
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();