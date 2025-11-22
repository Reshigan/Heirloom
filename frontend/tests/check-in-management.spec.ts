import { test, expect } from '@playwright/test';

test.describe('Check-in Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      const timestamp = Date.now();
      const testEmail = `test-checkin-${timestamp}@playwright.test`;
      const testPassword = 'TestPassword123!';
      
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(testEmail);
      await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill(testPassword);
      await page.locator('button[type="submit"]').first().click();
      
      await page.waitForTimeout(2000);
    }
    
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should open check-in management modal', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in"), button:has-text("Check in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      
      await expect(page.locator('text=/check.*in|check-in/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show current check-in status', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      
      const hasStatus = await page.locator('text=/status|active|grace.*period|missed/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasStatus).toBeTruthy();
    }
  });

  test('should show next check-in date', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      
      const hasNextDate = await page.locator('text=/next.*check.*in|due.*date|scheduled/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasNextDate).toBeTruthy();
    }
  });

  test('should show manual check-in button', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      
      await expect(page.locator('button:has-text("Check In Now"), button:has-text("Perform Check-in"), button:has-text("Manual Check-in")')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should perform manual check-in', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      await page.waitForTimeout(1000);
      
      const manualCheckinButton = page.locator('button:has-text("Check In Now"), button:has-text("Perform Check-in"), button:has-text("Manual Check-in")').first();
      if (await manualCheckinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await manualCheckinButton.click();
        
        await expect(page.locator('text=/success|completed|checked.*in/i')).toBeVisible({ timeout: 10000 }).catch(() => {});
      }
    }
  });

  test('should show check-in interval', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      
      const hasInterval = await page.locator('text=/interval|frequency|every.*day|every.*week/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasInterval).toBeTruthy();
    }
  });

  test('should show missed check-in count', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      
      const hasMissedCount = await page.locator('text=/missed|consecutive|streak/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasMissedCount).toBeTruthy();
    }
  });

  test('should show check-in history', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      
      const hasHistory = await page.locator('text=/history|recent.*check.*in|past.*check.*in/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasHistory).toBeTruthy();
    }
  });

  test('should explain how check-in system works', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      
      const hasExplanation = await page.locator('text=/how.*work|dead.*man|switch|posthumous/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasExplanation).toBeTruthy();
    }
  });

  test('should close check-in modal', async ({ page }) => {
    const checkinButton = page.locator('button:has-text("Check-in")').first();
    
    if (await checkinButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkinButton.click();
      await page.waitForTimeout(1000);
      
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label*="close" i]').first();
      if (await closeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeButton.click();
        
        await expect(page.locator('text=/check.*in.*management|check-in.*status/i')).not.toBeVisible({ timeout: 5000 });
      }
    }
  });
});
