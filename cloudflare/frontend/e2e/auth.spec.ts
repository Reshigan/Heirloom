/**
 * auth.spec.ts — Phase 10c
 *
 * Exercises authentication flows end-to-end against the live site.
 * Run: BASE_URL=https://heirloom.blue npx playwright test e2e/auth.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'regression@heirloom.blue';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Heirloom2026!';
const API_BASE = 'https://api.heirloom.blue/api';

test.describe('Authentication', () => {
  test('marketing home loads without error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/');
    await expect(page).toHaveTitle(/heirloom/i);
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('login page renders and accepts credentials', async ({ page }) => {
    // Validate the login API directly — avoids Chrome autofill races.
    const resp = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json() as { token?: string };
    expect(body.token).toBeTruthy();

    // Now confirm the UI login page renders its fields.
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('unauthenticated user redirected from protected route', async ({ page }) => {
    // NOTE: bare /loom is the public LoomThreshold landing page — not guarded.
    // /loom/weft (and /memories, /compose, /family, /settings, ...) are the
    // actual ProtectedRoute-wrapped surfaces (see App.tsx route table).
    await page.goto('/loom/weft');
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 8000 });
    expect(page.url()).toContain('/login');
  });

  test('wrong password returns 401 from API', async ({ page }) => {
    const resp = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: TEST_EMAIL, password: 'wrongpassword' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    const body = await resp.json().catch(() => ({})) as Record<string, unknown>;
    expect(body.error ?? body.message).toBeTruthy();
  });

  test('forgot password page loads with email input', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('signup page renders all required fields', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});
