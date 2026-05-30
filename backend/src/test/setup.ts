// Vitest global setup. Runs before each test file's module graph is imported,
// so the env schema in src/config/env.ts (parsed at import time) sees a complete,
// valid environment. These are throwaway test values — never real secrets.
// dotenv.config() does not override already-set process.env, so these win.

const TEST_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3001',
  API_URL: 'http://localhost:3001',
  FRONTEND_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/heirloom_test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long-xx',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-at-least-32-chars-long',
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  S3_BUCKET_NAME: 'heirloom-test',
  S3_BUCKET_REGION: 'us-east-1',
  STRIPE_SECRET_KEY: 'sk_test_dummy_value',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_dummy_value',
  SMTP_HOST: 'smtp.test.local',
  SMTP_PORT: '587',
  SMTP_USER: 'test',
  SMTP_PASS: 'test',
  EMAIL_FROM: 'noreply@heirloom.test',
  // base64 of 32 bytes — valid AES-256 key material for the escrow path.
  ENCRYPTION_MASTER_KEY: Buffer.alloc(32, 7).toString('base64'),
};

for (const [k, v] of Object.entries(TEST_ENV)) {
  if (process.env[k] === undefined) process.env[k] = v;
}
