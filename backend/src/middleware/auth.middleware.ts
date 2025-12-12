import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { User } from '@prisma/client';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

/**
 * Authentication middleware - requires valid JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing authentication token' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const user = await authService.getUserFromToken(token);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    req.sessionId = payload.sessionId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication - attaches user if token present
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.getUserFromToken(token);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch {
    next();
  }
};

/**
 * Require email verification
 */
export const requireVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.emailVerified) {
    res.status(403).json({ error: 'Email verification required' });
    return;
  }
  next();
};
