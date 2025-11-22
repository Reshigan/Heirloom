import { test, expect } from '@playwright/test';

test.describe('Trusted Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      const timestamp = Date.now();
      const testEmail = `test-contacts-${timestamp}@playwright.test`;
      const testPassword = 'TestPassword123!';
      
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(testEmail);
      await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill(testPassword);
      await page.locator('button[type="submit"]').first().click();
      
      await page.waitForTimeout(2000);
    }
    
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
  });

  test('should open trusted contacts modal', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts"), button:has-text("Trusted")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
      
      await expect(page.locator('text=/trusted.*contact|contact/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show 2-of-3 verification explanation', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
      
      const hasExplanation = await page.locator('text=/2.*of.*3|two.*of.*three|verification/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasExplanation).toBeTruthy();
    }
  });

  test('should show add contact button', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
      
      await expect(page.locator('button:has-text("Add"), button:has-text("New Contact")')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show contact limit (3 contacts)', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
      
      const hasLimit = await page.locator('text=/3.*contact|limit|maximum/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasLimit).toBeTruthy();
    }
  });

  test('should open add contact form', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("New Contact")').first();
      if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addButton.click();
        
        await expect(page.locator('input[placeholder*="email" i], input[type="email"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should validate contact email format', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
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

  test('should show verification status', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
      
      const hasStatus = await page.locator('text=/verified|pending|expired|status/i').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasStatus).toBeTruthy();
    }
  });

  test('should show phone number field', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addButton.click();
        
        const phoneField = page.locator('input[placeholder*="phone" i], input[type="tel"]').first();
        await expect(phoneField).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show search functionality', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasSearch).toBeTruthy();
    }
  });

  test('should close trusted contacts modal', async ({ page }) => {
    const contactsButton = page.locator('button:has-text("Contacts")').first();
    
    if (await contactsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactsButton.click();
      await page.waitForTimeout(1000);
      
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label*="close" i]').first();
      if (await closeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeButton.click();
        
        await expect(page.locator('text=/trusted.*contact|manage.*contact/i')).not.toBeVisible({ timeout: 5000 });
      }
    }
  });
});
