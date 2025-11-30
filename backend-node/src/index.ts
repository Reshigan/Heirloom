import { app } from './app';
import { prisma } from './db';
import { JobScheduler } from './services/jobScheduler';

const PORT = process.env.PORT || 3001;

let jobScheduler: JobScheduler;

async function startServer() {
  try {
    jobScheduler = new JobScheduler();
    await jobScheduler.start();
    
    app.listen(PORT, () => {
      console.log(`🚀 Constellation Vault API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: Helmet enabled, Rate limiting active`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.log('⚠️  Continuing without job scheduler...');
    app.listen(PORT, () => {
      console.log(`🚀 Constellation Vault API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: Helmet enabled, Rate limiting active`);
    });
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  if (jobScheduler) await jobScheduler.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  if (jobScheduler) await jobScheduler.stop();
  await prisma.$disconnect();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  startServer();
}
