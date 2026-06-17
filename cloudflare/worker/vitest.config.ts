import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Worker-pool tests import the `cloudflare:test` virtual module, which only
    // resolves under vitest.worker.config.mts. Exclude them here or this plain
    // node run fails to load them and `npm test`'s `&&` short-circuits before
    // the worker config ever runs.
    exclude: ['**/node_modules/**', '**/*.worker.test.ts'],
    globals: true,
    environment: 'node',
  },
});
