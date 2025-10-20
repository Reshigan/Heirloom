import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:12003';

test.describe('Authentication E2E Tests', () => {
  let testUser: any;

  test.beforeEach(() => {
    testUser = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName()
    };
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    await page.fill('[data-testid="first-name-input"]', testUser.firstName);
    await page.fill('[data-testid="last-name-input"]', testUser.lastName);
    
    // Submit form
    await page.click('[data-testid="register-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    
    // Should show welcome message
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(testUser.firstName);
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    // Try to submit with invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // First register a user
    await page.goto(`${BASE_URL}/register`);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    await page.fill('[data-testid="first-name-input"]', testUser.firstName);
    await page.fill('[data-testid="last-name-input"]', testUser.lastName);
    await page.click('[data-testid="register-button"]');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Now login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]');
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL(`${BASE_URL}/forgot-password`);
    
    // Enter email
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.click('[data-testid="reset-password-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="reset-success-message"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login first
    await page.goto(`${BASE_URL}/register`);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    await page.fill('[data-testid="first-name-input"]', testUser.firstName);
    await page.fill('[data-testid="last-name-input"]', testUser.lastName);
    await page.click('[data-testid="register-button"]');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to home page
    await expect(page).toHaveURL(`${BASE_URL}/`);
    
    // Should not be able to access protected pages
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('should persist login state across page refreshes', async ({ page }) => {
    // Register and login
    await page.goto(`${BASE_URL}/register`);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    await page.fill('[data-testid="first-name-input"]', testUser.firstName);
    await page.fill('[data-testid="last-name-input"]', testUser.lastName);
    await page.click('[data-testid="register-button"]');
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    // This test would require manipulating session expiration
    // In a real implementation, you'd test token expiration handling
    await page.goto(`${BASE_URL}/register`);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    await page.fill('[data-testid="first-name-input"]', testUser.firstName);
    await page.fill('[data-testid="last-name-input"]', testUser.lastName);
    await page.click('[data-testid="register-button"]');
    
    // Simulate expired session by clearing storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Try to access protected page
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should redirect to login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('should show loading states during authentication', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    
    // Click login and immediately check for loading state
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="login-loading"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept network requests and simulate failure
    await page.route('**/api/auth/login', route => {
      route.abort('failed');
    });
    
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    
    // Should show network error message
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
  });
});