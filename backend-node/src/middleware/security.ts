import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    console.log('📡 Sentry error monitoring enabled');
  }
}

export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Allow frontend to load resources
  crossOriginEmbedderPolicy: false,
});

export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100000'), // Increased for simulation testing
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased for simulation testing
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const sentryRequestHandler = () => {
  if (process.env.SENTRY_DSN) {
    return Sentry.Handlers.requestHandler();
  }
  return (req: Request, res: Response, next: NextFunction) => next();
};

export const sentryTracingHandler = () => {
  if (process.env.SENTRY_DSN) {
    return Sentry.Handlers.tracingHandler();
  }
  return (req: Request, res: Response, next: NextFunction) => next();
};

export const sentryErrorHandler = () => {
  if (process.env.SENTRY_DSN) {
    return Sentry.Handlers.errorHandler();
  }
  return (req: Request, res: Response, next: NextFunction) => next();
};

export const enhancedErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;

  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
