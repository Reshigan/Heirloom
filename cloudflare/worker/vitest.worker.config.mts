import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: '../wrangler.toml' },
      // isolatedStorage: false — lets beforeAll() create schema once per file;
      // tests use unique IDs/codes so state doesn't bleed between them.
      isolatedStorage: false,
    }),
  ],
  test: {
    include: ['src/__tests__/**/*.worker.test.ts'],
    globalSetup: ['src/__tests__/helpers/global-setup.ts'],
  },
});
