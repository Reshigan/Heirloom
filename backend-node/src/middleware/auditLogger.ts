import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from './auth';

/**
 * Audit logging middleware
 * Logs sensitive operations to audit_log table
 */
export const auditLogger = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const sensitiveRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/vault/upload',
    '/api/vault/items',
    '/api/trusted-contacts',
    '/api/check-in',
    '/api/subscriptions'
  ];

  const shouldLog = sensitiveRoutes.some(route => req.path.startsWith(route));

  if (shouldLog && req.method !== 'GET') {
    const originalSend = res.send;
    res.send = function (data: any) {
      res.send = originalSend;
      
      setImmediate(async () => {
        try {
          await prisma.auditLog.create({
            data: {
              userId: req.user?.userId,
              action: `${req.method} ${req.path}`,
              details: {
                body: req.body,
                query: req.query,
                params: req.params
              },
              ipAddress: req.ip || req.socket.remoteAddress,
              userAgent: req.headers['user-agent']
            }
          });
        } catch (error) {
          console.error('Audit log error:', error);
        }
      });

      return originalSend.call(this, data);
    };
  }

  next();
};
