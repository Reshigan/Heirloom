import { test, expect } from '@playwright/test';

test.describe('Capture Console Error', () => {
  test('should capture console errors on /app page', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
    });
    
    await page.goto('http://loom.vantax.co.za/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    console.log('\n=== PAGE ERRORS ===');
    errors.forEach(err => console.log(err));
    
    await page.screenshot({ path: 'test-results/app-page-error.png', fullPage: true });
  });
});
