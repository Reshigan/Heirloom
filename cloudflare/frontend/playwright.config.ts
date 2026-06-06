import { defineConfig, devices } from '@playwright/test';

// The canonical test origin. Both chromium and mobile use the same URL so
// api.heirloom.blue's CORS allowlist (which includes localhost:5173) accepts
// requests from both projects without needing a second origin.
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: true,
  },
  // Start the Vite dev server automatically so both projects hit the same port.
  // Reuse an already-running server when developing locally (reuseExistingServer).
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 15'],
        // Increase navigation and action timeouts for mobile — the emulated
        // device is slower and auth redirects can settle later than on desktop.
        navigationTimeout: 15000,
        actionTimeout: 10000,
      },
    },
  ],
  timeout: 30000,
  expect: { timeout: 10000 },
});
