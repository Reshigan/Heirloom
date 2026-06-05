/**
 * 01-public-routes.spec.ts
 *
 * Verifies every public loom route loads without JS errors and renders
 * a non-empty body. Covers both the marketing shell and loom sub-pages
 * that are accessible without authentication.
 */

import { test, expect } from '@playwright/test';

const PUBLIC_ROUTES = [
  { path: '/',               label: 'marketing landing' },
  { path: '/loom',           label: 'loom threshold' },
  { path: '/loom/echo',      label: 'loom echo / listener' },
  { path: '/loom/read',      label: 'loom reading room' },
  { path: '/loom/pwa',       label: 'loom pwa home' },
  { path: '/loom/unlock',    label: 'loom unlock' },
  { path: '/loom/marketing', label: 'loom marketing alias' },
  { path: '/login',          label: 'login' },
  { path: '/signup',         label: 'signup' },
  { path: '/pricing',        label: 'pricing' },
  { path: '/gift',           label: 'gift purchase' },
  { path: '/privacy',        label: 'privacy policy' },
  { path: '/terms',          label: 'terms of service' },
  { path: '/contact',        label: 'contact' },
];

for (const route of PUBLIC_ROUTES) {
  test(`${route.label} (${route.path}) loads without JS error`, async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known benign noise
        if (!text.includes('DevTools') && !text.includes('favicon') && !text.includes('net::ERR_')) {
          criticalErrors.push(text);
        }
      }
    });
    page.on('pageerror', err => criticalErrors.push(err.message));

    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    // Body must have rendered content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(0);

    // No unhandled JS exceptions
    expect(criticalErrors, `Critical JS errors on ${route.path}: ${criticalErrors.join('; ')}`).toHaveLength(0);
  });
}

test('404 renders not-found page with content', async ({ page }) => {
  await page.goto('/this-page-absolutely-does-not-exist-99999');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').textContent();
  expect(bodyText?.trim().length).toBeGreaterThan(0);
  // Should not crash — body should have meaningful text
  expect(bodyText).not.toMatch(/^undefined$|^null$/);
});

test('daily sentence page loads', async ({ page }) => {
  await page.goto('/daily');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').textContent();
  expect(bodyText?.trim().length).toBeGreaterThan(0);
});

test('founders wall page loads', async ({ page }) => {
  await page.goto('/founders-wall');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').textContent();
  expect(bodyText?.trim().length).toBeGreaterThan(0);
});
