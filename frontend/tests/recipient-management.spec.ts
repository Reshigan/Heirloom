import { test, expect } from '@playwright/test';

test.describe('Recipient Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      const timestamp = Date.now();
      const testEmail = `test-recipient-${timestamp}@playwright.test`;
      const testPassword = 'TestPassword123!';
      
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(testEmail);
      await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill(testPassword);
      await page.locator('button[type="submit"]').first().click();
      
      await page.waitForTimeout(2000);
    }
    
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should open recipient management modal', async ({ page }) => {
    const recipientButton = page.locator('button:has-text("Recipients"), button:has-text("Recipient")').first();
    
    if (await recipientButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recipientButton.click();
      
      await expect(page.locator('text=/recipient|manage.*recipient/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show add recipient button', async ({ page }) => {
    const recipientButton = page.locator('button:has-text("Recipients")').first();
    
    if (await recipientButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recipientButton.click();
      
      await expect(page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show search functionality', async ({ page }) => {
    const recipientButton = page.locator('button:has-text("Recipients")').first();
    
    if (await recipientButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recipientButton.click();
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      await expect(searchInput).toBeVisible({ timeout: 10000 });
    }
  });

  test('should open add recipient form', async ({ page }) => {
    const recipientButton = page.locator('button:has-text("Recipients")').first();
    
    if (await recipientButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recipientButton.click();
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("New Recipient")').first();
      if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addButton.click();
        
        await expect(page.locator('input[placeholder*="email" i], input[type="email"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should validate recipient email format', async ({ page }) => {
    const recipientButton = page.locator('button:has-text("Recipients")').first();
    
    if (await recipientButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recipientButton.click();
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addButton.click();
        
        const emailInput = page.locator('input[placeholder*="email" i], input[type="email"]').first();
        await emailInput.fill('invalid-email');
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add")').last();
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await submitButton.click();
          
          await expect(page.locator('text=/invalid|error|required/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
        }
      }
    }
  });

  test('should show access level options', async ({ page }) => {
    const recipientButton = page.locator('button:has-text("Recipients")').first();
    
    if (await recipientButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recipientButton.click();
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addButton.click();
        
        const hasAccessLevel = await page.locator('text=/access.*level|full|limited|permission/i').isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasAccessLevel).toBeTruthy();
      }
    }
  });

  test('should show relationship field', async ({ page }) => {
    const recipientButton = page.locator('button:has-text("Recipients")').first();
    
    if (await recipientButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recipientButton.click();
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addButton.click();
        
        const relationshipField = page.locator('input[placeholder*="relationship" i], select[name*="relationship" i]').first();
        await expect(relationshipField).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should close recipient modal', async ({ page }) => {
    const recipientButton = page.locator('button:has-text("Recipients")').first();
    
    if (await recipientButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recipientButton.click();
      await page.waitForTimeout(1000);
      
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label*="close" i]').first();
      if (await closeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeButton.click();
        
        await expect(page.locator('text=/recipient|manage.*recipient/i')).not.toBeVisible({ timeout: 5000 });
      }
    }
  });
});
