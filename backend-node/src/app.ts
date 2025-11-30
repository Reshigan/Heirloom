import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import vaultRoutes from './routes/vault';
import recipientRoutes from './routes/recipients';
import trustedContactRoutes from './routes/trustedContacts';
import checkInRoutes from './routes/checkIn';
import subscriptionRoutes from './routes/subscriptions';
import unlockRoutes from './routes/unlock';
import notificationRoutes from './routes/notifications';
import searchRoutes from './routes/search';
import commentsRoutes from './routes/comments';
import highlightsRoutes from './routes/highlights';
import timeCapsuleRoutes from './routes/timeCapsules';
import importsRoutes from './routes/imports';
import digestRoutes from './routes/digest';
import curatorRoutes from './routes/curator';
import analyticsRoutes from './routes/analytics';
import storyReelsRoutes from './routes/story-reels';
import afterImGoneLettersRoutes from './routes/after-im-gone-letters';
import memorialPagesRoutes from './routes/memorial-pages';
import { errorHandler } from './middleware/errorHandler';
import { auditLogger } from './middleware/auditLogger';
import {
  initSentry,
  securityHeaders,
  generalLimiter,
  authLimiter,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  enhancedErrorHandler,
} from './middleware/security';

dotenv.config();

if (process.env.NODE_ENV !== 'test') {
  initSentry();
}

(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

const app = express();

app.set('trust proxy', true);

app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

app.use(securityHeaders);
app.use(generalLimiter);

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://3.8.160.221',
    'http://loom.vantax.co.za',
    'https://loom.vantax.co.za'
  ],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(auditLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/trusted-contacts', trustedContactRoutes);
app.use('/api/check-in', checkInRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/unlock', unlockRoutes);
app.use('/api', notificationRoutes);
app.use('/api', searchRoutes);
app.use('/api', commentsRoutes);
app.use('/api/highlights', highlightsRoutes);
app.use('/api/time-capsules', timeCapsuleRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/digest', digestRoutes);
app.use('/api/curator', curatorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/story-reels', storyReelsRoutes);
app.use('/api/after-im-gone-letters', afterImGoneLettersRoutes);
app.use('/api/memorial-pages', memorialPagesRoutes);

app.use(sentryErrorHandler());

app.use(enhancedErrorHandler);
app.use(errorHandler);

export { app };
