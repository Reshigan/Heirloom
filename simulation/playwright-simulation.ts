import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://loom.vantax.co.za';
const CONCURRENT_USERS = 50;
const SESSION_DURATION_MS = 8 * 60 * 1000; // 8 minutes per session

interface TestUser {
  email: string;
  password: string;
  userId: string;
  vaultId: string;
}

async function simulateUserSession(browser: Browser, user: TestUser, sessionId: number) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`[Session ${sessionId}] Starting for ${user.email}`);

    await page.addInitScript(() => {
      (window as any).trackEvent = (event: string, properties?: any) => {
        console.log(`[Analytics] ${event}`, properties);
      };
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const loginButton = await page.locator('button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(1000);

      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      console.log(`[Session ${sessionId}] Logged in`);
    }

    await page.waitForTimeout(2000);
    console.log(`[Session ${sessionId}] Browsing memories`);

    const searchButton = await page.locator('[data-testid="search-button"]').first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(2000);
      console.log(`[Session ${sessionId}] Opened search`);
    }

    const notificationBell = await page.locator('[data-testid="notification-bell"]').first();
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      await page.waitForTimeout(2000);
      console.log(`[Session ${sessionId}] Checked notifications`);
    }

    const heartbeatInterval = setInterval(async () => {
      try {
        await page.evaluate(() => {
          (window as any).trackEvent?.('time_in_app_heartbeat');
        });
      } catch (error) {
      }
    }, 15000); // Every 15 seconds

    await page.waitForTimeout(SESSION_DURATION_MS);

    clearInterval(heartbeatInterval);
    console.log(`[Session ${sessionId}] Session complete for ${user.email}`);
  } catch (error) {
    console.error(`[Session ${sessionId}] Error:`, error);
  } finally {
    await context.close();
  }
}

async function runSimulation() {
  console.log('🚀 Starting Playwright simulation with 50 concurrent users...');

  const testUsers: TestUser[] = JSON.parse(
    fs.readFileSync('/tmp/test-users.json', 'utf-8')
  );

  const playwrightUsers = testUsers.slice(0, CONCURRENT_USERS);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log(`✅ Browser launched, starting ${CONCURRENT_USERS} sessions...`);

  const sessions = playwrightUsers.map((user, index) =>
    simulateUserSession(browser, user, index + 1)
  );

  await Promise.all(sessions);

  await browser.close();
  console.log('✅ Playwright simulation complete!');
}

runSimulation()
  .catch((error) => {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  });
