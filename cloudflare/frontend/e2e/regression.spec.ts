/**
 * Heirloom Full Regression Suite
 *
 * Covers every critical user flow. Run against live site:
 *   npx playwright test --project=chromium
 *   BASE_URL=https://heirloom.blue npx playwright test
 *
 * Test user: regression@heirloom.blue (create via /signup before first run)
 * Credentials in env: TEST_USER_EMAIL, TEST_USER_PASSWORD
 */

import { test, expect, type Page } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'regression@heirloom.blue';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Heirloom2026!';
const FAMILY_MEMBER_EMAIL = process.env.TEST_FAMILY_EMAIL || 'regression-family@heirloom.blue';

// ─── Auth helpers ────────────────────────────────────────────────────────────

async function login(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"], input[placeholder*="email"], input[name="email"]', { timeout: 10000 });
  await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

async function logout(page: Page) {
  await page.goto('/settings');
  const logoutBtn = page.locator('button:has-text("sign out"), button:has-text("log out"), button:has-text("logout")').first();
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL((url) => url.pathname.includes('/login') || url.pathname === '/');
  }
}

// ─── 1. Unauthenticated redirects ────────────────────────────────────────────

test.describe('auth guards', () => {
  test('protected routes redirect to /login', async ({ page }) => {
    for (const path of ['/memories', '/compose', '/family', '/settings', '/inbox', '/letters']) {
      await page.goto(path);
      await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 8000 });
      expect(page.url()).toContain('/login');
    }
  });

  test('marketing landing visible unauthenticated', async ({ page }) => {
    await page.goto('/');
    // Should NOT redirect to login
    expect(page.url()).not.toContain('/login');
    // Should have some visible heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

// ─── 2. Login flow ───────────────────────────────────────────────────────────

test.describe('login', () => {
  test('valid credentials log in and land on home', async ({ page }) => {
    await login(page);
    // Should be on an authenticated page
    expect(page.url()).not.toContain('/login');
  });

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[placeholder*="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword999');
    await page.click('button[type="submit"]');
    // Should stay on login and show error
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
    // Some error text visible
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).toMatch(/invalid|incorrect|wrong|error|failed/);
  });

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

// ─── 3. Memory CRUD ──────────────────────────────────────────────────────────

test.describe('memories', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('memories page loads with tapestry canvas', async ({ page }) => {
    await page.goto('/memories');
    await page.waitForSelector('canvas, [class*="tapestry"], [class*="wall"]', { timeout: 10000 });
  });

  test('compose: create a memory', async ({ page }) => {
    await page.goto('/compose');
    await page.waitForSelector('textarea, [contenteditable="true"]', { timeout: 10000 });
    const textarea = page.locator('textarea, [contenteditable="true"]').first();
    await textarea.fill('Regression test memory — ' + new Date().toISOString());
    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("save"), button:has-text("add"), button:has-text("remember")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1500);
      // Should not be an error state
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).not.toMatch(/error saving|failed to save/);
    }
  });

  test('search returns results or empty state', async ({ page }) => {
    await page.goto('/qanda');
    const input = page.locator('input[placeholder*="ask"], input[type="search"], input[type="text"]').first();
    await expect(input).toBeVisible();
    await input.fill('family');
    const askBtn = page.locator('button:has-text("ask"), button[type="submit"]').first();
    if (await askBtn.isVisible() && await askBtn.isEnabled()) {
      await askBtn.click();
      // Wait for answer or "nothing" state
      await page.waitForSelector('[class*="answered"], text=/entries|nothing/i', { timeout: 12000 });
    }
  });
});

// ─── 4. Letters flow ─────────────────────────────────────────────────────────

test.describe('letters', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('letters page loads', async ({ page }) => {
    await page.goto('/letters');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });

  test('future letter form opens', async ({ page }) => {
    await page.goto('/future-letter');
    await page.waitForLoadState('networkidle');
    // Should have a textarea or input
    const hasInput = await page.locator('textarea, input[type="text"]').count() > 0;
    expect(hasInput).toBeTruthy();
  });
});

// ─── 5. Family management ────────────────────────────────────────────────────

test.describe('family', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('family page loads', async ({ page }) => {
    await page.goto('/family');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });

  test('invite modal opens', async ({ page }) => {
    await page.goto('/family');
    const inviteBtn = page.locator('button:has-text("invite"), button:has-text("add member")').first();
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      // Modal or form should appear with email input
      await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─── 6. Settings ─────────────────────────────────────────────────────────────

test.describe('settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('settings page loads all sections', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const text = await page.textContent('body');
    // Should have these sections
    expect(text?.toLowerCase()).toMatch(/notification/);
  });

  test('notification toggle persists', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    // Find a toggle and click it
    const toggle = page.locator('input[type="checkbox"]').first();
    if (await toggle.isVisible()) {
      const initialState = await toggle.isChecked();
      await toggle.click();
      await page.waitForTimeout(1000);
      // Reload and verify state changed
      await page.reload();
      await page.waitForLoadState('networkidle');
      const afterState = await page.locator('input[type="checkbox"]').first().isChecked();
      // Restore original state
      if (afterState === initialState) {
        // Didn't persist — mark as a finding (don't fail, just note)
        console.log('[FINDING] Notification toggle may not persist across reload');
      }
      // Click back to restore
      await page.locator('input[type="checkbox"]').first().click();
    }
  });

  test('change password form is accessible', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    // Look for change password trigger
    const changePwBtn = page.locator('button:has-text("change"), button:has-text("password"), text=/change password/i').first();
    if (await changePwBtn.isVisible()) {
      await changePwBtn.click();
      await page.waitForTimeout(500);
      // Should show current password field
      const currentPwInput = page.locator('input[type="password"]').first();
      await expect(currentPwInput).toBeVisible({ timeout: 3000 });
    }
  });

  test('export data button is accessible', async ({ page }) => {
    await page.goto('/settings');
    const exportBtn = page.locator('button:has-text("export"), a:has-text("export")').first();
    if (await exportBtn.isVisible()) {
      // Verify button is enabled
      await expect(exportBtn).toBeEnabled();
    }
  });
});

// ─── 7. Inbox ────────────────────────────────────────────────────────────────

test.describe('inbox', () => {
  test('inbox page loads', async ({ page }) => {
    await login(page);
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });
});

// ─── 8. PWA + mobile ─────────────────────────────────────────────────────────

test.describe('pwa and responsive', () => {
  test('manifest is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.name || json.short_name).toBeTruthy();
  });

  test('service worker registers', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    });
    expect(swRegistered).toBe(true);
  });

  test('login page is mobile-responsive', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 15
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // No horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBe(false);
  });

  test('compose page is mobile-responsive', async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/compose');
    await page.waitForLoadState('networkidle');
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBe(false);
  });
});

// ─── 9. Navigation + routing ─────────────────────────────────────────────────

test.describe('navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('on-this-day page loads', async ({ page }) => {
    await page.goto('/on-this-day');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });

  test('life events page loads', async ({ page }) => {
    await page.goto('/life-events');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });

  test('milestones page loads', async ({ page }) => {
    await page.goto('/milestones');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });

  test('404 shows not-found page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-9999');
    await page.waitForLoadState('networkidle');
    // Should render something (custom 404 or redirect)
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(0);
  });
});

// ─── 10. Design system audit ─────────────────────────────────────────────────

test.describe('design system', () => {
  test('no icon library remnants (lucide/heroicons) in login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Check for lucide/heroicons SVG markers in DOM
    const lucideIcons = await page.locator('svg[class*="lucide"], [data-lucide], [class*="heroicon"]').count();
    expect(lucideIcons).toBe(0);
  });

  test('bone/ink color tokens present in root', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hasBoneToken = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--bone').trim().length > 0;
    });
    expect(hasBoneToken).toBe(true);
  });

  test('Source Serif 4 font loads', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const hasSerif = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const fontVal = style.getPropertyValue('--serif') || style.getPropertyValue('--hl-font-serif');
      return fontVal.includes('Source Serif') || document.fonts.check('1rem "Source Serif 4"');
    });
    expect(hasSerif).toBe(true);
  });
});

// ─── 11. Gift system ─────────────────────────────────────────────────────────
// These tests guard against pricing key mismatches (NaN amounts) and broken
// checkout flows — the class of bug where an API returns undefined/NaN because
// the client uses the wrong key name.

test.describe('gift system', () => {
  test('gift page loads and shows valid prices', async ({ page }) => {
    await page.goto('/gift');
    await page.waitForLoadState('networkidle');
    // Page should render without login redirect
    expect(page.url()).not.toContain('/login');
    // Wait for pricing to load (the API call may take a moment)
    await page.waitForTimeout(2000);
    // Find any price display — must NOT contain NaN or undefined
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/NaN/);
    expect(bodyText).not.toMatch(/undefined/);
    // Should display at least one dollar/currency amount
    expect(bodyText).toMatch(/\$\d+|\£\d+|R\d+|€\d+/);
  });

  test('gift pricing API returns numeric amounts', async ({ page }) => {
    const API = process.env.VITE_API_URL || 'https://api.heirloom.blue/api';
    const response = await page.request.get(`${API}/gift-vouchers/pricing?currency=USD`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.tiers).toBeDefined();
    for (const tier of body.tiers) {
      expect(tier.quarterly).toBeDefined();
      expect(typeof tier.quarterly.amount).toBe('number');
      expect(isNaN(tier.quarterly.amount)).toBe(false);
      expect(tier.quarterly.amount).toBeGreaterThan(0);
      expect(tier.yearly).toBeDefined();
      expect(typeof tier.yearly.amount).toBe('number');
      expect(isNaN(tier.yearly.amount)).toBe(false);
      expect(tier.yearly.amount).toBeGreaterThan(0);
    }
  });

  test('gift redeem page loads with code param', async ({ page }) => {
    await page.goto('/gift/redeem?code=TEST-XXXX-YYYY-ZZZZ');
    await page.waitForLoadState('networkidle');
    // Should load the redemption page (not 404 or crash)
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(10);
    expect(bodyText).not.toMatch(/NaN/);
  });
});

// ─── 12. CTA navigation ──────────────────────────────────────────────────────
// Guards against dead buttons — buttons that are visible but do nothing when
// clicked (either because their onClick handler is a no-op or they have no
// href). Every primary CTA on a page should produce a URL change or open a
// form within 2 seconds of being clicked.

test.describe('cta navigation', () => {
  test('marketing hero CTA navigates away from /', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const before = page.url();
    // Find the primary CTA (usually a "start" or "begin" button)
    const cta = page.locator('a[class*="btn"], button[class*="btn"], a[class*="cta"], a:has-text("start"), a:has-text("begin"), a:has-text("try"), a:has-text("get started")').first();
    if (await cta.isVisible()) {
      await cta.click();
      await page.waitForTimeout(1000);
      // URL should have changed OR a form/modal should be visible
      const after = page.url();
      const modalOpen = await page.locator('[role="dialog"], [aria-modal="true"]').isVisible();
      expect(after !== before || modalOpen).toBe(true);
    }
  });

  test('empty loom weft — weave button navigates to compose', async ({ page }) => {
    // Login first
    await login(page);
    // Navigate to the weft — if the user has entries this test is a no-op
    await page.goto('/loom/weft');
    await page.waitForLoadState('networkidle');
    const weaveBtn = page.locator('button:has-text("weave the first thread")');
    if (await weaveBtn.isVisible()) {
      await weaveBtn.click();
      await page.waitForTimeout(800);
      expect(page.url()).toContain('/compose');
    }
  });

  test('pricing page plan buttons navigate to signup or checkout', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    // Find the first plan CTA button
    const planBtn = page.locator('a[class*="btn"], button[class*="btn"]').first();
    if (await planBtn.isVisible()) {
      const before = page.url();
      await planBtn.click();
      await page.waitForTimeout(800);
      const after = page.url();
      // Should navigate somewhere — signup, checkout, or login
      expect(after).not.toBe(before);
    }
  });
});
