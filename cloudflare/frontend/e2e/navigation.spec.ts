/**
 * navigation.spec.ts — Phase 10c
 *
 * Routing, static assets, security headers, and public API smoke.
 * All assertions run against the live site (BASE_URL=https://heirloom.blue).
 *
 * Run: BASE_URL=https://heirloom.blue npx playwright test e2e/navigation.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation & routing', () => {
  test('marketing home responds 200', async ({ page }) => {
    const resp = await page.goto('/');
    expect(resp?.status()).toBe(200);
  });

  test('SPA handles unknown routes (Cloudflare Pages SPA fallback)', async ({ page }) => {
    const resp = await page.goto('/this-route-definitely-does-not-exist-xyz');
    // Cloudflare Pages serves index.html for every unmatched path — 200, not 404.
    expect(resp?.status()).toBe(200);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('API health check returns ok', async ({ request }) => {
    const resp = await request.get('https://api.heirloom.blue/api/health');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as { status?: string };
    expect(body.status).toBe('ok');
  });

  test('sitemap.xml is present and valid', async ({ request }) => {
    const resp = await request.get('/sitemap.xml');
    expect(resp.status()).toBe(200);
    const text = await resp.text();
    expect(text).toContain('<urlset');
  });

  test('sw.js is served with no-cache header', async ({ request }) => {
    const resp = await request.get('/sw.js');
    expect(resp.status()).toBe(200);
    const cc = resp.headers()['cache-control'] ?? '';
    expect(cc).toMatch(/no-cache|no-store/);
  });

  test('security headers present on main page', async ({ request }) => {
    const resp = await request.get('/');
    const headers = resp.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('manifest.webmanifest is accessible', async ({ request }) => {
    const resp = await request.get('/manifest.webmanifest');
    expect(resp.status()).toBe(200);
    const json = await resp.json() as { name?: string; short_name?: string };
    expect(json.name ?? json.short_name).toBeTruthy();
  });

  test('public engagement stats return valid shape', async ({ request }) => {
    // NOTE: the public stats endpoint lives at /api/public/stats (a direct
    // proxy mount in worker/src/index.ts) — NOT /api/engagement/public/stats,
    // which is auth-gated under protectedApp (engagement-v2.ts).
    const resp = await request.get('https://api.heirloom.blue/api/public/stats');
    expect(resp.status()).toBe(200);
    const body = await resp.json() as { memories_preserved?: unknown; families_connected?: unknown };
    expect(typeof body.memories_preserved).toBe('number');
    expect(typeof body.families_connected).toBe('number');
  });
});
