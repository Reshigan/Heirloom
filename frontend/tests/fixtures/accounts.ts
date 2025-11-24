/**
 * Multi-user test fixtures
 * Creates and manages storage states for different personas
 */

import { test as base, Page } from '@playwright/test';
import { registerUser, loginUser, User } from '../utils/api';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://loom.vantax.co.za';
const ORIGIN = new URL(BASE_URL).origin;

export interface TestAccounts {
  owner: User;
  recipient: User;
  trustedContact: User;
}

/**
 * Helper to create an authenticated page for a user
 */
async function createAuthenticatedPage(browser: any, token: string): Promise<Page> {
  const context = await browser.newContext();
  
  await context.addInitScript((key: string, value: string) => {
    window.localStorage.setItem(key, value);
  }, 'vault_token', token);
  
  const page = await context.newPage();
  
  await page.goto(BASE_URL + '/app');
  
  await page.waitForFunction(() => !!localStorage.getItem('vault_token'));
  
  await page.getByTestId('search-button').waitFor({ state: 'visible', timeout: 15000 });
  
  return page;
}

/**
 * Extended test fixture with multi-user support
 */
export const test = base.extend<{
  accounts: TestAccounts;
  ownerPage: Page;
  recipientPage: Page;
  trustedContactPage: Page;
}>({
  accounts: async ({}, use) => {
    const timestamp = Date.now();
    
    const ownerEmail = `owner-${timestamp}@test.heirloom.local`;
    const recipientEmail = `recipient-${timestamp}@test.heirloom.local`;
    const trustedEmail = `trusted-${timestamp}@test.heirloom.local`;
    const password = 'TestPassword123!';
    
    await registerUser(ownerEmail, password);
    await registerUser(recipientEmail, password);
    await registerUser(trustedEmail, password);
    
    const owner = await loginUser(ownerEmail, password);
    const recipient = await loginUser(recipientEmail, password);
    const trustedContact = await loginUser(trustedEmail, password);

    await use({ owner, recipient, trustedContact });
  },

  ownerPage: async ({ browser, accounts }, use) => {
    const page = await createAuthenticatedPage(browser, accounts.owner.token);
    await use(page);
    await page.context().close();
  },

  recipientPage: async ({ browser, accounts }, use) => {
    const page = await createAuthenticatedPage(browser, accounts.recipient.token);
    await use(page);
    await page.context().close();
  },

  trustedContactPage: async ({ browser, accounts }, use) => {
    const page = await createAuthenticatedPage(browser, accounts.trustedContact.token);
    await use(page);
    await page.context().close();
  }
});

export { expect } from '@playwright/test';
