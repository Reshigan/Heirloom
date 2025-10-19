import { z } from 'zod';

const configSchema = z.object({
  // Server Configuration
  server: z.object({
    port: z.number().default(3001),
    host: z.string().default('0.0.0.0'),
    env: z.enum(['development', 'staging', 'production']).default('development'),
  }),

  // Database Configuration
  database: z.object({
    url: z.string(),
  }),

  // Redis Configuration
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
  }),

  // JWT Configuration
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.string().default('7d'),
  }),

  // CORS Configuration
  cors: z.object({
    origins: z.array(z.string()).default(['http://localhost:12000', 'https://heirloom.app']),
  }),

  // Email Configuration
  email: z.object({
    host: z.string().default('smtp.gmail.com'),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    user: z.string(),
    password: z.string(),
    from: z.string().default('noreply@heirloom.app'),
  }),

  // Ollama AI Configuration
  ollama: z.object({
    host: z.string().default('http://localhost:11434'),
    model: z.string().default('llama3.1:70b'),
  }),

  // Stripe Configuration
  stripe: z.object({
    secretKey: z.string(),
    publishableKey: z.string(),
    webhookSecret: z.string(),
  }),

  // File Storage Configuration
  storage: z.object({
    provider: z.enum(['local', 's3', 'cloudinary']).default('local'),
    local: z.object({
      uploadPath: z.string().default('./uploads'),
    }).optional(),
    s3: z.object({
      bucket: z.string(),
      region: z.string(),
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
    }).optional(),
    cloudinary: z.object({
      cloudName: z.string(),
      apiKey: z.string(),
      apiSecret: z.string(),
    }).optional(),
  }),

  // App Configuration
  app: z.object({
    url: z.string().default('http://localhost:12000'),
    name: z.string().default('Heirloom'),
  }),

  // Security Configuration
  security: z.object({
    bcryptRounds: z.number().default(12),
    rateLimitMax: z.number().default(100),
    rateLimitWindow: z.string().default('1 minute'),
  }),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const rawConfig = {
    server: {
      port: parseInt(process.env.PORT || '3001'),
      host: process.env.HOST || '0.0.0.0',
      env: process.env.NODE_ENV || 'development',
    },
    database: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/heirloom',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:12000', 'https://heirloom.app'],
    },
    email: {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      password: process.env.EMAIL_PASSWORD || 'your-app-password',
      from: process.env.EMAIL_FROM || 'noreply@heirloom.app',
    },
    ollama: {
      host: process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.1:70b',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_...',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...',
    },
    storage: {
      provider: (process.env.STORAGE_PROVIDER as 'local' | 's3' | 'cloudinary') || 'local',
      local: {
        uploadPath: process.env.UPLOAD_PATH || './uploads',
      },
      s3: {
        bucket: process.env.S3_BUCKET || '',
        region: process.env.S3_REGION || '',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      },
    },
    app: {
      url: process.env.APP_URL || 'http://localhost:12000',
      name: process.env.APP_NAME || 'Heirloom',
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    console.error('❌ Invalid configuration:', error);
    process.exit(1);
  }
}

export const config = loadConfig();

// Environment-specific configurations
export const isDevelopment = config.server.env === 'development';
export const isProduction = config.server.env === 'production';
export const isStaging = config.server.env === 'staging';

// Feature flags based on environment
export const features = {
  aiStoryGeneration: true,
  timeCapsules: true,
  referralSystem: true,
  analytics: true,
  notifications: true,
  realTimeUpdates: true,
  legacyPlanning: true,
  // Disable certain features in development if needed
  emailNotifications: !isDevelopment || process.env.ENABLE_EMAIL === 'true',
  stripePayments: !isDevelopment || process.env.ENABLE_STRIPE === 'true',
};

// API Rate Limits by endpoint
export const rateLimits = {
  auth: { max: 5, window: '15 minutes' }, // Login attempts
  aiGeneration: { max: 10, window: '1 hour' }, // AI story generation
  fileUpload: { max: 20, window: '1 hour' }, // File uploads
  general: { max: 100, window: '1 minute' }, // General API calls
};

// Subscription tier limits
export const subscriptionLimits = {
  FREE: {
    maxMemories: 50,
    maxStorageGB: 1,
    maxFamilyMembers: 5,
    aiGenerationsPerMonth: 5,
    timeCapsules: 2,
  },
  BASIC: {
    maxMemories: 200,
    maxStorageGB: 5,
    maxFamilyMembers: 10,
    aiGenerationsPerMonth: 20,
    timeCapsules: 10,
  },
  PREMIUM: {
    maxMemories: 1000,
    maxStorageGB: 25,
    maxFamilyMembers: 25,
    aiGenerationsPerMonth: 100,
    timeCapsules: 50,
  },
  FAMILY: {
    maxMemories: 5000,
    maxStorageGB: 100,
    maxFamilyMembers: 100,
    aiGenerationsPerMonth: 500,
    timeCapsules: 200,
  },
  LEGACY: {
    maxMemories: -1, // Unlimited
    maxStorageGB: 500,
    maxFamilyMembers: -1, // Unlimited
    aiGenerationsPerMonth: -1, // Unlimited
    timeCapsules: -1, // Unlimited
  },
};

// AI Model configurations
export const aiModels = {
  'llama3.1:70b': {
    name: 'Llama 3.1 70B',
    description: 'Most capable model for complex storytelling',
    maxTokens: 4096,
    temperature: 0.7,
    costPerToken: 0.0001,
  },
  'llama3.1:8b': {
    name: 'Llama 3.1 8B',
    description: 'Faster model for quick responses',
    maxTokens: 2048,
    temperature: 0.7,
    costPerToken: 0.00005,
  },
  'codellama:34b': {
    name: 'Code Llama 34B',
    description: 'Specialized for technical content',
    maxTokens: 2048,
    temperature: 0.3,
    costPerToken: 0.00008,
  },
};

// Notification templates
export const notificationTemplates = {
  MEMORY_REMINDER: {
    title: '📸 Time to Capture a Memory',
    defaultMessage: 'It\'s been a while since your last memory. What special moment would you like to preserve today?',
  },
  FAMILY_INVITE: {
    title: '👨‍👩‍👧‍👦 Family Invitation',
    defaultMessage: 'You\'ve been invited to join a family on Heirloom!',
  },
  STORY_GENERATED: {
    title: '✨ Your AI Story is Ready',
    defaultMessage: 'Your personalized family story has been generated and is ready to view.',
  },
  TIME_CAPSULE_READY: {
    title: '📮 Time Capsule Delivered',
    defaultMessage: 'A time capsule has been delivered to you!',
  },
  SUBSCRIPTION_EXPIRING: {
    title: '⚠️ Subscription Expiring Soon',
    defaultMessage: 'Your Heirloom subscription is expiring soon. Renew to keep preserving your family\'s legacy.',
  },
  REFERRAL_REWARD: {
    title: '🎁 Referral Reward Earned',
    defaultMessage: 'Congratulations! You\'ve earned a reward for referring friends to Heirloom.',
  },
  LEGACY_REMINDER: {
    title: '🏛️ Legacy Planning Reminder',
    defaultMessage: 'Take a moment to review and update your legacy plans.',
  },
};

export default config;