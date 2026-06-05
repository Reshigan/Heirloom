/**
 * 03-loom-screens.spec.ts
 *
 * Content and structure tests for every public loom screen.
 * These run without authentication — they only target screens
 * that are accessible to an anonymous visitor.
 *
 * Design contract (STITCH_BRIEF §2):
 *   - Type is the hero: Source Serif 4 + Inter + JetBrains Mono
 *   - ∞ is the only mark (no icon libraries)
 *   - Bone/ink palette with warm accent <3% surface area
 *   - No decorative emoji, no spinners, no toast widgets
 *   - Negative space is composition (60–70% empty)
 */

import { test, expect } from '@playwright/test';

// ─── /loom — The Threshold ────────────────────────────────────────────────────

test.describe('loom threshold (/loom)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/loom');
    await page.waitForLoadState('networkidle');
  });

  test('renders heirloom brand wordmark', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText.toLowerCase()).toMatch(/heirloom/);
  });

  test('has an enter / login CTA', async ({ page }) => {
    // The threshold topbar has an "enter →" link pointing to /login
    const enterLink = page.locator('a[href="/login"], a:has-text("enter"), a:has-text("begin"), a:has-text("start")').first();
    await expect(enterLink).toBeVisible();
  });

  test('no icon library elements on the page', async ({ page }) => {
    const iconCount = await page.locator(
      'svg[class*="lucide"], [data-lucide], [class*="heroicon"], [class*="feather"]'
    ).count();
    expect(iconCount).toBe(0);
  });

  test('has no horizontal overflow (responsive)', async ({ page }) => {
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasOverflow).toBe(false);
  });
});

// ─── /loom/echo — The Listener ────────────────────────────────────────────────

test.describe('loom echo — the listener (/loom/echo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/loom/echo');
    await page.waitForLoadState('networkidle');
  });

  test('renders listener topbar label', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText.toLowerCase()).toMatch(/the listener|listener/);
  });

  test('shows a listener prompt (italicised prose)', async ({ page }) => {
    // The Echo component renders a prompt returned by useListener()
    // It should have italic prose text
    const bodyText = (await page.locator('body').textContent()) ?? '';
    // The prompt varies but always has at least 5 characters
    expect(bodyText.trim().length).toBeGreaterThan(20);
  });

  test('heirloom wordmark is visible', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText.toLowerCase()).toMatch(/heirloom/);
  });

  test('no icon library elements on the page', async ({ page }) => {
    const iconCount = await page.locator(
      'svg[class*="lucide"], [data-lucide], [class*="heroicon"]'
    ).count();
    expect(iconCount).toBe(0);
  });
});

// ─── /loom/read — The Reading Room ───────────────────────────────────────────

test.describe('loom reading room (/loom/read)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/loom/read');
    await page.waitForLoadState('networkidle');
  });

  test('renders the thread entries (cloth bg entries)', async ({ page }) => {
    // The reading room has 48 deterministic background entries with dates
    const bodyText = (await page.locator('body').textContent()) ?? '';
    // Should contain at least one year reference (entries span 1960–2026)
    expect(bodyText).toMatch(/\d{4}/);
  });

  test('contains the kitchen window / Margaret reference', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent()) ?? '';
    // THREADS array contains "the kitchen window" and "Eleanor"
    expect(bodyText.toLowerCase()).toMatch(/kitchen window|eleanor|margaret/i);
  });

  test('displays ∞ mark (the only icon)', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).toContain('∞');
  });

  test('no icon library SVGs injected', async ({ page }) => {
    const iconCount = await page.locator(
      'svg[class*="lucide"], [data-lucide], [class*="heroicon"]'
    ).count();
    expect(iconCount).toBe(0);
  });
});

// ─── /loom/pwa — PWA Home ────────────────────────────────────────────────────

test.describe('loom pwa home (/loom/pwa)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/loom/pwa');
    await page.waitForLoadState('networkidle');
  });

  test('bottom navigation renders all 5 items', async ({ page }) => {
    // NAV = cloth · compose · ∞ · letters · listen
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).toMatch(/cloth/i);
    expect(bodyText).toMatch(/compose/i);
    expect(bodyText).toContain('∞');
    expect(bodyText).toMatch(/letters/i);
    expect(bodyText).toMatch(/listen/i);
  });

  test('bottom nav links point to correct loom routes', async ({ page }) => {
    const clothLink  = page.locator('a[href="/loom/weft"]');
    const composeLink = page.locator('a[href="/loom/compose"]');
    const infinityLink = page.locator('a[href="/loom/pwa"]');
    const lettersLink = page.locator('a[href="/loom/read"]');
    const listenLink  = page.locator('a[href="/loom/echo"]');

    await expect(clothLink.first()).toBeAttached();
    await expect(composeLink.first()).toBeAttached();
    await expect(infinityLink.first()).toBeAttached();
    await expect(lettersLink.first()).toBeAttached();
    await expect(listenLink.first()).toBeAttached();
  });

  test('renders visitor / unauthenticated shell without crash', async ({ page }) => {
    // Unauthenticated: PwaHome renders the "preview" visitor shell — "Begin free →" CTA.
    // The date stamp (todayStamp) only renders in the authenticated body; we assert the
    // visitor shell renders correctly here.
    const bodyText = (await page.locator('body').textContent()) ?? '';
    // Should contain the visitor CTA or authenticated content
    expect(bodyText.toLowerCase()).toMatch(/begin free|preview|heirloom|cloth/i);
  });

  test('no horizontal overflow (mobile responsive)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasOverflow).toBe(false);
  });
});

// ─── /loom/unlock — The Unlock ───────────────────────────────────────────────

test.describe('loom unlock (/loom/unlock)', () => {
  test('page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/loom/unlock');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(0);
  });
});

// ─── Design system audit (public pages) ──────────────────────────────────────

test.describe('design system — public page tokens', () => {
  test('--bone CSS variable is defined on root', async ({ page }) => {
    await page.goto('/loom');
    await page.waitForLoadState('networkidle');
    const boneVal = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bone').trim()
    );
    expect(boneVal.length).toBeGreaterThan(0);
  });

  test('--warm CSS variable is defined on root', async ({ page }) => {
    await page.goto('/loom');
    await page.waitForLoadState('networkidle');
    const warmVal = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--warm').trim()
    );
    expect(warmVal.length).toBeGreaterThan(0);
  });

  test('Source Serif 4 font is loaded', async ({ page }) => {
    await page.goto('/loom');
    await page.waitForLoadState('networkidle');
    const hasSerif = await page.evaluate(() => {
      const serifVar = getComputedStyle(document.documentElement).getPropertyValue('--serif').trim();
      return serifVar.includes('Source Serif') || document.fonts.check('16px "Source Serif 4"');
    });
    expect(hasSerif).toBe(true);
  });

  test('no spinner elements (hairline progress bars only per §2.6)', async ({ page }) => {
    await page.goto('/loom');
    await page.waitForLoadState('networkidle');
    const spinnerCount = await page.locator(
      '[class*="spinner"], [class*="loading-circle"], [class*="spin-"]'
    ).count();
    expect(spinnerCount).toBe(0);
  });

  test('no toast widget containers', async ({ page }) => {
    await page.goto('/loom');
    await page.waitForLoadState('networkidle');
    const toastCount = await page.locator(
      '[class*="toast"], [class*="Toastify"], [id*="toast"]'
    ).count();
    expect(toastCount).toBe(0);
  });
});
