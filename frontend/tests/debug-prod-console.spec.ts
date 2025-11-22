import { test, expect } from '@playwright/test';

test.describe('Debug Production Console Errors', () => {
  test('capture all console errors and page errors from production build', async ({ page }) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      pageErrors.push(`[pageerror] ${error.message}\n${error.stack}`);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.locator('[data-testid="loading-screen"]').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    
    await page.waitForTimeout(5000);
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    console.log('\n=== PAGE ERRORS ===');
    pageErrors.forEach(err => console.log(err));
    
    console.log('\n=== PAGE CONTENT ===');
    const bodyText = await page.locator('body').textContent();
    console.log(bodyText?.substring(0, 500));
    
    console.log('\n=== BRAND ELEMENT COUNT ===');
    const brandCount = await page.locator('[data-testid="brand"]').count();
    console.log(`Brand elements found: ${brandCount}`);
    
    console.log('\n=== NAV ELEMENT COUNT ===');
    const navCount = await page.locator('[data-testid^="nav-"]').count();
    console.log(`Nav elements found: ${navCount}`);
    
    console.log('\n=== PAGE ERRORS SUMMARY ===');
    console.log(`Total page errors: ${pageErrors.length}`);
    console.log(`Total console errors: ${consoleMessages.length}`);
  });
});
