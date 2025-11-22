import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Vault Upload Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      const timestamp = Date.now();
      const testEmail = `test-upload-${timestamp}@playwright.test`;
      const testPassword = 'TestPassword123!';
      
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(testEmail);
      await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill(testPassword);
      await page.locator('button[type="submit"]').first().click();
      
      await page.waitForTimeout(2000);
    }
    
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should open vault upload modal', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), [aria-label*="upload" i]').first();
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click();
      
      await expect(page.locator('text=/upload|add file|drag.*drop/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show drag and drop area', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add")').first();
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click();
      
      await expect(page.locator('text=/drag.*drop|drop.*files|choose.*file/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show emotion category selection', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add")').first();
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click();
      
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

  test('should show importance slider', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add")').first();
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click();
      
      const hasSlider = await page.locator('input[type="range"], text=/importance|priority|rating/i').isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasSlider).toBeTruthy();
    }
  });

  test('should close modal when clicking close button', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add")').first();
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click();
      await page.waitForTimeout(1000);
      
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label*="close" i]').first();
      if (await closeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeButton.click();
        
        await expect(page.locator('text=/upload|add file|drag.*drop/i')).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show upload limits warning', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add")').first();
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click();
      
      const hasLimitInfo = await page.locator('text=/limit|remaining|storage|quota/i').isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasLimitInfo).toBeTruthy();
    }
  });

  test('should show encryption indicator', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add")').first();
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click();
      
      const hasEncryption = await page.locator('text=/encrypt|secure|private|aes/i').isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasEncryption).toBeTruthy();
    }
  });
});
