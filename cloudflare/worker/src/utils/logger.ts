/**
 * Structured Logger for Heirloom API
 * 
 * Provides consistent, structured logging across the worker.
 * Logs are formatted as JSON for easy parsing by log aggregators.
 * 
 * Usage:
 *   const logger = createLogger(c);
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Payment failed', { error: err, userId: '123' });
 */

import type { Context } from 'hono';
import type { AppEnv } from '../index';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  adminId?: string;
  route?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  edge?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
}

export interface Logger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => void;
  child: (context: Partial<LogContext>) => Logger;
}

/**
 * Create a logger instance with request context
 */
export function createLogger(c: Context<AppEnv>): Logger {
  const baseContext: LogContext = {
    requestId: crypto.randomUUID().slice(0, 8),
    route: c.req.path,
    method: c.req.method,
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
    userAgent: c.req.header('user-agent')?.slice(0, 100),
    edge: (c.req.raw.cf as { colo?: string })?.colo || 'unknown',
  };

  // Add user context if available
  const userId = c.get('userId');
  const adminId = c.get('adminId');
  if (userId) baseContext.userId = userId;
  if (adminId) baseContext.adminId = adminId;

  return createLoggerWithContext(baseContext);
}

/**
 * Create a logger with custom context (for use outside request handlers)
 */
export function createLoggerWithContext(context: LogContext): Logger {
  const log = (level: LogLevel, message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...context, ...data },
    };

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        entry.error = {
          name: 'UnknownError',
          message: String(error),
        };
      }
    }

    // Output as JSON for structured logging
    const output = JSON.stringify(entry);
    
    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  };

  return {
    debug: (message, data) => log('debug', message, undefined, data),
    info: (message, data) => log('info', message, undefined, data),
    warn: (message, data) => log('warn', message, undefined, data),
    error: (message, error, data) => log('error', message, error, data),
    child: (childContext) => createLoggerWithContext({ ...context, ...childContext }),
  };
}

/**
 * Middleware to add request logging
 */
export function requestLogger() {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    const start = Date.now();
    const logger = createLogger(c);
    
    // Store logger in context for use in route handlers
    // Note: This requires adding 'logger' to the Variables interface
    
    logger.info('Request started');
    
    try {
      await next();
    } catch (error) {
      logger.error('Request failed', error);
      throw error;
    } finally {
      const duration = Date.now() - start;
      logger.info('Request completed', { 
        duration,
        status: c.res.status,
      });
    }
  };
}

/**
 * Error handler middleware with structured logging
 */
export function errorHandler() {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      const logger = createLogger(c);
      
      if (error instanceof Error) {
        logger.error('Unhandled error', error, {
          errorType: error.constructor.name,
        });
        
        // Don't expose internal errors to clients
        return c.json({
          error: 'Internal server error',
          requestId: logger.debug ? undefined : undefined, // requestId is in context
        }, 500);
      }
      
      logger.error('Unknown error type', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  };
}
