import { defineConfig } from 'vitest/config';

// Unit-test config. Tests are pure/logic-level and must not require a live
// Postgres or Redis — service modules that pull in those clients are mocked
// at the test-file level (see *.test.ts). See ../plan.md Phase 1.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    // forks keeps each test file's module graph (and any stray client) isolated.
    pool: 'forks',
    testTimeout: 10000,
  },
});
