import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  API_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

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
export const TIER_LIMITS = {
  FREE: {
    maxMemories: 10,
    maxLetters: 3,
    maxRecipients: 2,
    maxVoiceMinutes: 5,
    maxStorageMB: 100,
  },
  ESSENTIAL: {
    maxMemories: 100,
    maxLetters: 20,
    maxRecipients: 5,
    maxVoiceMinutes: 30,
    maxStorageMB: 1024,
  },
  FAMILY: {
    maxMemories: -1, // unlimited
    maxLetters: -1,
    maxRecipients: -1,
    maxVoiceMinutes: 60,
    maxStorageMB: 10240,
  },
  LEGACY: {
    maxMemories: -1,
    maxLetters: -1,
    maxRecipients: -1,
    maxVoiceMinutes: -1,
    maxStorageMB: 102400,
  },
} as const;

// Pricing in USD cents
export const PRICING = {
  ESSENTIAL: {
    monthly: 299, // $2.99
    yearly: 2990, // $29.90 (2 months free)
  },
  FAMILY: {
    monthly: 1199, // $11.99
    yearly: 11990, // $119.90 (2 months free)
  },
  LEGACY: {
    yearly: 29900, // $299.00
  },
} as const;
