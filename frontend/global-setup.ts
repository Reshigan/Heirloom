import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  console.log('🔧 Global setup: Creating authenticated user...');
  
  const backendURL = 'https://loom.vantax.co.za/api';
  const testEmail = 'playwright-test@example.com';
  const testPassword = 'TestPassword123!';
  
  try {
    let token: string;
    
    const registerResponse = await fetch(`${backendURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    
    if (registerResponse.ok) {
      const data = await registerResponse.json();
      token = data.token;
      console.log('✅ User registered successfully');
    } else {
      const loginResponse = await fetch(`${backendURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      
      if (!loginResponse.ok) {
        throw new Error('Failed to login: ' + await loginResponse.text());
      }
      
      const data = await loginResponse.json();
      token = data.token;
      console.log('✅ User logged in successfully');
    }
    
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const targetURL = baseURL || 'http://localhost:3100';
    console.log(`🔗 Navigating to: ${targetURL}`);
    
    await page.goto(targetURL);
    await page.waitForLoadState('networkidle');
    
    await page.evaluate((token) => {
      localStorage.setItem('vault_token', token);
    }, token);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.locator('[data-testid="loading-screen"]').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
    
    const searchButton = await page.getByTestId('search-button').isVisible({ timeout: 10000 }).catch(() => false);
    const notificationButton = await page.getByTestId('notifications-button').isVisible({ timeout: 10000 }).catch(() => false);
    
    if (searchButton || notificationButton) {
      console.log('✅ Authentication verified - header buttons visible');
    } else {
      console.log('⚠️  Warning: Could not verify authentication - header buttons not found');
      const apiResponse = await fetch(`${backendURL}/vault/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null);
      
      if (apiResponse && apiResponse.ok) {
        console.log('✅ Authentication verified via API call');
      } else {
        console.log('❌ Authentication verification failed');
      }
    }
    
    await context.storageState({ path: 'storageState.json' });
    console.log('✅ Storage state saved to storageState.json');
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;
