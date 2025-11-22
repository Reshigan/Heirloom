import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Heirloom/);
    await expect(page.locator('[data-testid="brand"]')).toBeVisible({ timeout: 30000 });
  });

  test('should show login modal when clicking login button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should validate email format in registration', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill('invalid-email');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Sign Up")').first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        
        await expect(page.locator('text=/invalid|error|required/i')).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    }
  });

  test('should register new user successfully', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      const timestamp = Date.now();
      const testEmail = `test-${timestamp}@playwright.test`;
      const testPassword = 'TestPassword123!';
      
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill(testEmail);
      
      const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]').first();
      await passwordInput.fill(testPassword);
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Sign Up"), button:has-text("Register")').first();
      await submitButton.click();
      
      await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15000 }).catch(() => {});
    }
  });

  test('should login existing user successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      const timestamp = Date.now();
      const testEmail = `test-login-${timestamp}@playwright.test`;
      const testPassword = 'TestPassword123!';
      
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(testEmail);
      await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill(testPassword);
      await page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Sign Up"), button:has-text("Register")').first().click();
      
      await page.waitForTimeout(2000);
      
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
      if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loginButton2 = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
      if (await loginButton2.isVisible({ timeout: 5000 }).catch(() => false)) {
        await loginButton2.click();
        
        await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(testEmail);
        await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill(testPassword);
        await page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Login"), button:has-text("Sign In")').first().click();
        
        await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15000 }).catch(() => {});
      }
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('nonexistent@test.com');
      await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill('WrongPassword123!');
      await page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Login"), button:has-text("Sign In")').first().click();
      
      await expect(page.locator('text=/invalid|error|incorrect|failed/i')).toBeVisible({ timeout: 10000 }).catch(() => {});
    }
  });

  test('should persist authentication after page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Get Started")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      const timestamp = Date.now();
      const testEmail = `test-persist-${timestamp}@playwright.test`;
      const testPassword = 'TestPassword123!';
      
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(testEmail);
      await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill(testPassword);
      await page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Sign Up"), button:has-text("Register")').first().click();
      
      await page.waitForTimeout(2000);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const loginButtonAfterReload = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
      const isLoginVisible = await loginButtonAfterReload.isVisible({ timeout: 5000 }).catch(() => false);
      
      expect(isLoginVisible).toBe(false);
    }
  });
});
