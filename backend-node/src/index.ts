import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma';
import authRoutes from './routes/auth';
import vaultRoutes from './routes/vault';
import recipientRoutes from './routes/recipients';
import trustedContactRoutes from './routes/trustedContacts';
import checkInRoutes from './routes/checkIn';
import subscriptionRoutes from './routes/subscriptions';
import { errorHandler } from './middleware/errorHandler';
import { auditLogger } from './middleware/auditLogger';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(auditLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/trusted-contacts', trustedContactRoutes);
app.use('/api/check-in', checkInRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.use(errorHandler);

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Constellation Vault API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { prisma };
