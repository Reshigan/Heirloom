import { defineConfig, devices } from '@playwright/test';

// The canonical test origin. Both chromium and mobile use the same URL so
// api.heirloom.blue's CORS allowlist (which includes localhost:5173) accepts
// requests from both projects without needing a second origin.
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Skip the local Vite dev server when BASE_URL points at an external host
// (e.g. BASE_URL=https://heirloom.blue for staging runs).
const isExternal = BASE_URL.startsWith('https://') || BASE_URL.startsWith('http://') && !BASE_URL.includes('localhost');

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
  // Skipped entirely when BASE_URL points at staging / production.
  // Reuse an already-running server when developing locally (reuseExistingServer).
  ...(!isExternal ? {
    webServer: {
      command: 'npm run dev -- --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  } : {}),
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // The Deep renders a WebGL WaterCanvas on every screen. Under continuous
        // animation a long serial run (100+ navigations, one process) exhausts the
        // GPU's WebGL contexts and crashes. WaterCanvas paints a single static
        // frame under prefers-reduced-motion (no animation loop), so emulating it
        // removes the crash AND speeds boot (the #hl-splash overlay clears fast,
        // unblocking form fills) without the SwiftShader slow-software penalty.
        reducedMotion: 'reduce',
        // Bound every action so a stale selector fails in 15s instead of eating
        // the whole test/hook budget (mobile already caps at 10s).
        actionTimeout: 15000,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 15'],
        // Increase navigation and action timeouts for mobile — the emulated
        // device is slower and auth redirects can settle later than on desktop.
        navigationTimeout: 15000,
        actionTimeout: 10000,
        reducedMotion: 'reduce',
      },
    },
  ],
  timeout: 30000,
  expect: { timeout: 10000 },
});
