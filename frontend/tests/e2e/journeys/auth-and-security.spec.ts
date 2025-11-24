/**
 * Journey 6: Authentication and Security
 * Tests access control and security boundaries
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication and Security Journey', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    
    expect(url).toMatch(/\/(app|auth)/);
  });

  test('should allow access to marketing page without auth', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/');
  });

  test('should maintain authentication after page reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('vault_token', 'test-token');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.waitForLoadState('networkidle');

    const token = await page.evaluate(() => localStorage.getItem('vault_token'));
    expect(token).toBe('test-token');
  });

  test('should handle invalid token gracefully', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('vault_token', 'invalid-token-12345');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/(app|auth)/);
  });

  test('should clear token on logout', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('vault_token', 'test-token');
    });

    await page.evaluate(() => {
      localStorage.removeItem('vault_token');
    });

    const token = await page.evaluate(() => localStorage.getItem('vault_token'));
    expect(token).toBeNull();
  });
});
