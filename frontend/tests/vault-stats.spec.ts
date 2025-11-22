import { test, expect } from '@playwright/test';

test.describe('Vault Stats Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      const timestamp = Date.now();
      const testEmail = `test-stats-${timestamp}@playwright.test`;
      const testPassword = 'TestPassword123!';
      
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(testEmail);
      await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill(testPassword);
      await page.locator('button[type="submit"]').first().click();
      
      await page.waitForTimeout(2000);
    }
    
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should open vault stats dashboard', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats"), button:has-text("Statistics")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      await expect(page.locator('text=/stats|statistics|dashboard/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show storage usage', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      const hasStorage = await page.locator('text=/storage|used|available|GB|MB/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasStorage).toBeTruthy();
    }
  });

  test('should show upload limits', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      const hasLimits = await page.locator('text=/upload.*limit|weekly.*limit|remaining/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasLimits).toBeTruthy();
    }
  });

  test('should show total items count', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      const hasTotal = await page.locator('text=/total.*item|item.*count|\d+.*item/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasTotal).toBeTruthy();
    }
  });

  test('should show recipients count', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      const hasRecipients = await page.locator('text=/recipient|\d+.*recipient/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasRecipients).toBeTruthy();
    }
  });

  test('should show items breakdown by type', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      const hasTypeBreakdown = await page.locator('text=/photo|video|audio|document|type/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasTypeBreakdown).toBeTruthy();
    }
  });

  test('should show items breakdown by emotion', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      const emotions = ['joy', 'love', 'nostalgia', 'gratitude', 'wisdom'];
      let foundEmotion = false;
      
      for (const emotion of emotions) {
        if (await page.locator(`text=${emotion}`, { hasText: new RegExp(emotion, 'i') }).isVisible({ timeout: 2000 }).catch(() => false)) {
          foundEmotion = true;
          break;
        }
      }
      
      expect(foundEmotion).toBe(true);
    }
  });

  test('should show subscription tier', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      const hasTier = await page.locator('text=/free|premium|family|tier|plan/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasTier).toBeTruthy();
    }
  });

  test('should show progress bars or visualizations', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      const hasVisualization = await page.locator('[role="progressbar"], svg, canvas, text=/progress|\d+%/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasVisualization).toBeTruthy();
    }
  });

  test('should show upgrade button for free tier', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      
      const hasUpgrade = await page.locator('button:has-text("Upgrade"), button:has-text("Premium"), a:has-text("Upgrade")').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasUpgrade).toBeTruthy();
    }
  });

  test('should close vault stats modal', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    
    if (await statsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statsButton.click();
      await page.waitForTimeout(1000);
      
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label*="close" i]').first();
      if (await closeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeButton.click();
        
        await expect(page.locator('text=/vault.*stats|statistics.*dashboard/i')).not.toBeVisible({ timeout: 5000 });
      }
    }
  });
});
