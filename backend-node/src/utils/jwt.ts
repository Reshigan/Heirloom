import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  vaultId?: string;
}

export class JWTUtils {
  /**
   * Generate JWT token
   */
  static sign(payload: JWTPayload): string {
    return jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verify and decode JWT token
   */
  static verify(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode JWT without verification (for debugging)
   */
  static decode(token: string): JWTPayload | null {
    return jwt.decode(token) as JWTPayload | null;
  }
}
