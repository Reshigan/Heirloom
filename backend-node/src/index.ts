import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import vaultRoutes from './routes/vault';
import recipientRoutes from './routes/recipients';
import trustedContactRoutes from './routes/trustedContacts';
import checkInRoutes from './routes/checkIn';
import subscriptionRoutes from './routes/subscriptions';
import unlockRoutes from './routes/unlock';
import notificationRoutes from './routes/notifications';
import searchRoutes from './routes/search';
import { errorHandler } from './middleware/errorHandler';
import { auditLogger } from './middleware/auditLogger';
import { JobScheduler } from './services/jobScheduler';

dotenv.config();

(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://3.8.160.221',
    'http://loom.vantax.co.za'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(auditLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/trusted-contacts', trustedContactRoutes);
app.use('/api/check-in', checkInRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/unlock', unlockRoutes);
app.use('/api', notificationRoutes);
app.use('/api', searchRoutes);

app.use(errorHandler);

let jobScheduler: JobScheduler;

async function startServer() {
  try {
    jobScheduler = new JobScheduler();
    await jobScheduler.start();
    
    app.listen(PORT, () => {
      console.log(`🚀 Constellation Vault API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.log('⚠️  Continuing without job scheduler...');
    app.listen(PORT, () => {
      console.log(`🚀 Constellation Vault API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
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

startServer();

export { prisma };
