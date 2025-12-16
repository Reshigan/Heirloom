import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import familyRoutes from './routes/family.routes';
import memoriesRoutes from './routes/memories.routes';
import lettersRoutes from './routes/letters.routes';
import voiceRoutes from './routes/voice.routes';
import billingRoutes from './routes/billing.routes';
import settingsRoutes from './routes/settings.routes';
import deadmanRoutes from './routes/deadman.routes';
import encryptionRoutes from './routes/encryption.routes';
import adminRoutes from './routes/admin.routes';
import wrappedRoutes from './routes/wrapped';

const app = express();

// Trust proxy for rate limiting behind Nginx/Cloudflare
// Set to 2 if Cloudflare is in front of Nginx, 1 if just one proxy
app.set('trust proxy', 2);

// Parse allowed CORS origins from environment
const getAllowedOrigins = (): string[] => {
  const origins = [env.FRONTEND_URL];
  if (env.CORS_ORIGINS) {
    origins.push(...env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean));
  }
  return origins;
};

// Security middleware
app.use(helmet({
  // Allow Cloudflare to set these headers
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration for Cloudflare deployment
const allowedOrigins = getAllowedOrigins();
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// Body parsing - raw for Stripe webhooks
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/letters', lettersRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/deadman', deadmanRoutes);
app.use('/api/encryption', encryptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wrapped', wrappedRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

export default app;
