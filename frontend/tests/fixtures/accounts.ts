/**
 * Multi-user test fixtures
 * Creates and manages storage states for different personas
 */

import { test as base, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { registerUser, loginUser, User } from '../utils/api';

export interface TestAccounts {
  owner: User;
  recipient: User;
  trustedContact: User;
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
    
    const owner = await registerUser(
      `owner-${timestamp}@test.heirloom.local`,
      'TestPassword123!'
    );
    
    const recipient = await registerUser(
      `recipient-${timestamp}@test.heirloom.local`,
      'TestPassword123!'
    );
    
    const trustedContact = await registerUser(
      `trusted-${timestamp}@test.heirloom.local`,
      'TestPassword123!'
    );

    await use({ owner, recipient, trustedContact });
  },

  ownerPage: async ({ browser, accounts }, use) => {
    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://loom.vantax.co.za',
            localStorage: [
              {
                name: 'vault_token',
                value: accounts.owner.token
              }
            ]
          }
        ]
      }
    });
    
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  recipientPage: async ({ browser, accounts }, use) => {
    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://loom.vantax.co.za',
            localStorage: [
              {
                name: 'vault_token',
                value: accounts.recipient.token
              }
            ]
          }
        ]
      }
    });
    
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  trustedContactPage: async ({ browser, accounts }, use) => {
    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://loom.vantax.co.za',
            localStorage: [
              {
                name: 'vault_token',
                value: accounts.trustedContact.token
              }
            ]
          }
        ]
      }
    });
    
    const page = await context.newPage();
    await use(page);
    await context.close();
  }
});

export { expect } from '@playwright/test';
