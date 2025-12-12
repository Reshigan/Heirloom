import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { env } from '../config/env';
import prisma from '../config/database';
import { cache, redis } from '../config/redis';
import { logger } from '../utils/logger';
import { User } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export const authService = {
  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },

  /**
   * Verify a password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate JWT tokens
   */
  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    // Parse expiration time
    const expiresIn = this.parseExpiration(env.JWT_EXPIRES_IN);

    return { accessToken, refreshToken, expiresIn };
  },

  /**
   * Parse expiration string to seconds
   */
  parseExpiration(exp: string): number {
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) return 604800; // default 7 days

    const [, num, unit] = match;
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return parseInt(num) * (multipliers[unit] || 86400);
  },

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  },

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload & { type: string };
      if (payload.type !== 'refresh') return null;
      return payload;
    } catch {
      return null;
    }
  },

  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password, firstName, lastName } = input;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    // Create user
    const passwordHash = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        subscription: {
          create: { tier: 'FREE', status: 'ACTIVE' },
        },
      },
    });

    // Create session
    const sessionId = uuid();
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      sessionId,
    });

    // Store session
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + this.parseExpiration(env.JWT_REFRESH_EXPIRES_IN) * 1000),
      },
    });

    logger.info(`User registered: ${user.email}`);

    return { user, tokens };
  },

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password, userAgent, ipAddress } = input;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // Create session
    const sessionId = uuid();
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      sessionId,
    });

    // Store session
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: tokens.refreshToken,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + this.parseExpiration(env.JWT_REFRESH_EXPIRES_IN) * 1000),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Cache session for quick validation
    await cache.set(
      cache.sessionKey(tokens.accessToken),
      { userId: user.id, sessionId },
      this.parseExpiration(env.JWT_EXPIRES_IN)
    );

    logger.info(`User logged in: ${user.email}`);

    return { user, tokens };
  },

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Verify session exists
    const session = await prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        token: refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new Error('Session expired or invalid');
    }

    // Generate new tokens
    const newTokens = this.generateTokens({
      userId: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId,
    });

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + this.parseExpiration(env.JWT_REFRESH_EXPIRES_IN) * 1000),
      },
    });

    return newTokens;
  },

  /**
   * Logout user
   */
  async logout(sessionId: string, accessToken?: string): Promise<void> {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    
    if (accessToken) {
      await cache.del(cache.sessionKey(accessToken));
    }

    logger.info(`Session terminated: ${sessionId}`);
  },

  /**
   * Logout all sessions for user
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
    await cache.delPattern(`session:*`);
    logger.info(`All sessions terminated for user: ${userId}`);
  },

  /**
   * Get user from token (with caching)
   */
  async getUserFromToken(token: string): Promise<User | null> {
    const payload = this.verifyAccessToken(token);
    if (!payload) return null;

    // Check cache first
    const cached = await cache.get<{ userId: string }>(cache.sessionKey(token));
    if (!cached) return null;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    return user;
  },
};
