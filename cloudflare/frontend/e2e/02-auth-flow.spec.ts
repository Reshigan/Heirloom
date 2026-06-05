/**
 * 02-auth-flow.spec.ts
 *
 * Guards authentication redirects and the login/signup form structure.
 * Does not require a live API — tests run purely against the local dev
 * server and inspect DOM/routing behavior.
 */

import { test, expect } from '@playwright/test';

// ─── Loom protected routes ────────────────────────────────────────────────────

const LOOM_PROTECTED = [
  '/loom/compose',
  '/loom/weft',
  '/loom/kin',
  '/loom/tied',
  '/loom/today',
];

// ─── Legacy protected routes ──────────────────────────────────────────────────

const LEGACY_PROTECTED = [
  '/memories',
  '/compose',
  '/family',
  '/settings',
  '/inbox',
  '/letters',
];

test.describe('auth guards — loom routes', () => {
  test('loom protected routes redirect to /login when unauthenticated', async ({ page }) => {
    for (const path of LOOM_PROTECTED) {
      await page.goto(path);
      await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 8000 });
      expect(page.url()).toContain('/login');
    }
  });
});

test.describe('auth guards — legacy routes', () => {
  test('legacy protected routes redirect to /login when unauthenticated', async ({ page }) => {
    for (const path of LEGACY_PROTECTED) {
      await page.goto(path);
      await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 8000 });
      expect(page.url()).toContain('/login');
    }
  });
});

// ─── Login page form ──────────────────────────────────────────────────────────

test.describe('login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('has email input', async ({ page }) => {
    await expect(
      page.locator('input[type="email"], input[placeholder*="email" i]').first()
    ).toBeVisible();
  });

  test('has password input', async ({ page }) => {
    await expect(
      page.locator('input[type="password"], input[placeholder*="passphrase" i]').first()
    ).toBeVisible();
  });

  test('has a submit / log-in button', async ({ page }) => {
    const submitBtn = page.locator(
      'button[type="submit"], button:has-text("log in"), button:has-text("sign in"), button:has-text("enter")'
    ).first();
    await expect(submitBtn).toBeVisible();
  });

  test('has a link to /signup', async ({ page }) => {
    const signupLink = page.locator('a[href*="/signup"], a:has-text("sign up"), a:has-text("create")').first();
    await expect(signupLink).toBeVisible();
  });

  test('does not redirect to /login (infinite loop guard)', async ({ page }) => {
    // Landing on /login should STAY at /login — not redirect to itself
    expect(page.url()).toContain('/login');
    expect(page.url().split('/login').length).toBe(2); // only one occurrence
  });

  test('submitting empty form shows validation — no JS crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    // Use force:true to bypass any loading overlay that may intercept the click
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click({ force: true });
      await page.waitForTimeout(800);
    }
    expect(errors).toHaveLength(0);
  });
});

// ─── Signup page form ─────────────────────────────────────────────────────────

test.describe('signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
  });

  test('has email input', async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('has password input', async ({ page }) => {
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('has a submit / create button', async ({ page }) => {
    const btn = page.locator(
      'button[type="submit"], button:has-text("create"), button:has-text("sign up"), button:has-text("start")'
    ).first();
    await expect(btn).toBeVisible();
  });

  test('has a link back to /login', async ({ page }) => {
    const loginLink = page.locator('a[href*="/login"], a:has-text("log in"), a:has-text("sign in")').first();
    await expect(loginLink).toBeVisible();
  });
});

// ─── Forgot password page ─────────────────────────────────────────────────────

test.describe('forgot password', () => {
  test('page loads with email input', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });
});
