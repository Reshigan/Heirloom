import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  API_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  // Comma-separated list of allowed origins for CORS (Cloudflare Pages, preview URLs, etc.)
  CORS_ORIGINS: z.string().optional(),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // AWS S3
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_BUCKET_REGION: z.string(),

  // Stripe
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),

  // Email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string().email(),

  // Encryption
  ENCRYPTION_MASTER_KEY: z.string().min(32),
});

export const env = envSchema.parse(process.env);

// Subscription tier limits
// FREE tier is permanent and usable — chosen so a real family can get value
// without paying. Conversion comes from gift purchases + storage upgrades, not
// from gating basic preservation behind a paywall.
export const TIER_LIMITS = {
  FREE: {
    maxMemories: 50,
    maxLetters: 10,
    maxRecipients: 5,
    maxVoiceMinutes: 15,
    maxStorageMB: 1024,
  },
  ESSENTIAL: {
    maxMemories: 500,
    maxLetters: 100,
    maxRecipients: 15,
    maxVoiceMinutes: 60,
    maxStorageMB: 5120,
  },
  FAMILY: {
    maxMemories: -1,
    maxLetters: -1,
    maxRecipients: -1,
    maxVoiceMinutes: 180,
    maxStorageMB: 25600,
  },
  LEGACY: {
    maxMemories: -1,
    maxLetters: -1,
    maxRecipients: -1,
    maxVoiceMinutes: -1,
    maxStorageMB: 102400,
  },
} as const;

// Pricing in USD cents — Storyworth-inspired: gift purchase is the primary
// wedge, monthly subscription is secondary. See marketing/POSITIONING.md.
export const PRICING = {
  ESSENTIAL: {
    monthly: 499,
    yearly: 4900,
  },
  FAMILY: {
    monthly: 999,
    yearly: 9900,
  },
  LEGACY: {
    yearly: 19900,
  },
  GIFT_YEAR: {
    once: 9900,
  },
} as const;
