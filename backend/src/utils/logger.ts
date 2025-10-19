import winston from 'winston';
import { config } from './config.js';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.server.env === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: {
    service: 'heirloom-backend',
    environment: config.server.env,
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: config.server.env === 'production' ? logFormat : consoleFormat,
    }),
    
    // File transports for production
    ...(config.server.env === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : []),
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Create specialized loggers for different components
export const aiLogger = logger.child({ component: 'ai-service' });
export const authLogger = logger.child({ component: 'auth' });
export const notificationLogger = logger.child({ component: 'notifications' });
export const referralLogger = logger.child({ component: 'referrals' });
export const dbLogger = logger.child({ component: 'database' });
export const wsLogger = logger.child({ component: 'websocket' });

// Performance logging utility
export const performanceLogger = {
  start: (operation: string) => {
    const startTime = Date.now();
    return {
      end: (metadata?: any) => {
        const duration = Date.now() - startTime;
        logger.info(`Performance: ${operation}`, {
          duration: `${duration}ms`,
          operation,
          ...metadata,
        });
        return duration;
      },
    };
  },
};

// Request logging middleware helper
export const requestLogger = {
  logRequest: (req: any, res: any, responseTime: number) => {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id,
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  },
};

// Security logging
export const securityLogger = {
  logAuthAttempt: (email: string, success: boolean, ip: string, userAgent?: string) => {
    logger.info('Authentication Attempt', {
      email,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  },
  
  logSuspiciousActivity: (userId: string, activity: string, metadata?: any) => {
    logger.warn('Suspicious Activity', {
      userId,
      activity,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  },
  
  logRateLimitExceeded: (ip: string, endpoint: string, limit: number) => {
    logger.warn('Rate Limit Exceeded', {
      ip,
      endpoint,
      limit,
      timestamp: new Date().toISOString(),
    });
  },
};

// Business metrics logging
export const metricsLogger = {
  logUserRegistration: (userId: string, referralCode?: string) => {
    logger.info('User Registration', {
      userId,
      referralCode,
      timestamp: new Date().toISOString(),
    });
  },
  
  logSubscriptionChange: (userId: string, fromTier: string, toTier: string) => {
    logger.info('Subscription Change', {
      userId,
      fromTier,
      toTier,
      timestamp: new Date().toISOString(),
    });
  },
  
  logAIUsage: (userId: string, model: string, tokensUsed: number, responseTime: number) => {
    logger.info('AI Usage', {
      userId,
      model,
      tokensUsed,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  },
  
  logMemoryCreated: (userId: string, familyId: string, memoryType: string) => {
    logger.info('Memory Created', {
      userId,
      familyId,
      memoryType,
      timestamp: new Date().toISOString(),
    });
  },
  
  logReferralCompleted: (referrerId: string, referredUserId: string) => {
    logger.info('Referral Completed', {
      referrerId,
      referredUserId,
      timestamp: new Date().toISOString(),
    });
  },
};

// Error logging with context
export const errorLogger = {
  logError: (error: Error, context?: any) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: new Date().toISOString(),
    });
  },
  
  logDatabaseError: (error: Error, query?: string, params?: any) => {
    logger.error('Database Error', {
      message: error.message,
      stack: error.stack,
      query,
      params,
      timestamp: new Date().toISOString(),
    });
  },
  
  logExternalServiceError: (service: string, error: Error, request?: any) => {
    logger.error('External Service Error', {
      service,
      message: error.message,
      stack: error.stack,
      request,
      timestamp: new Date().toISOString(),
    });
  },
};

// Development helpers
if (config.server.env === 'development') {
  logger.debug('Logger initialized in development mode');
  logger.debug('Available log levels:', {
    levels: Object.keys(winston.config.npm.levels),
    currentLevel: logger.level,
  });
}

export default logger;