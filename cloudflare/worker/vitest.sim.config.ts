import { defineConfig } from 'vitest/config';

// Separate from vitest.config.ts so the heavier end-to-end lifetime simulation
// doesn't run as part of the fast unit suite (`npm test`). Run it explicitly:
//   npx vitest run --config vitest.sim.config.ts
export default defineConfig({
  test: {
    include: ['sim/**/*.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
