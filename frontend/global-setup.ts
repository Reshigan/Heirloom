import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(baseURL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    await page.locator('[data-testid="loading-screen"]').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    
    const signInButton = page.locator('[data-testid="sign-in-button"]');
    const isSignInVisible = await signInButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isSignInVisible) {
      await signInButton.click();
      await page.waitForTimeout(1000);
      
      const testEmail = 'playwright-test@example.com';
      const testPassword = 'TestPassword123!';
      
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(testEmail);
      await page.locator('input[type="password"], input[placeholder*="password" i]').first().fill(testPassword);
      await page.locator('button[type="submit"]').first().click();
      
      await page.waitForTimeout(3000);
      
      await page.locator('[data-testid="loading-screen"]').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
      
      const isLoggedIn = await page.locator('[data-testid="profile-button"], [data-testid="logout-button"]').isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isLoggedIn) {
        console.log('✅ Authentication successful - saving storage state');
      } else {
        console.log('⚠️  Authentication may have failed - saving state anyway');
      }
    } else {
      console.log('✅ Already authenticated - saving storage state');
    }
    
    await page.context().storageState({ path: 'storageState.json' });
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
