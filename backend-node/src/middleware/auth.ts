import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header OR cookie
 * Supports both Bearer token and HttpOnly cookie for flexibility
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token && req.cookies?.heirloom_token) {
      token = req.cookies.heirloom_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = JWTUtils.verify(token);
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = JWTUtils.verify(token);
      req.user = payload;
    }
    
    next();
  } catch (error) {
    next();
  }
};
