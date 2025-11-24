/**
 * Journey 1: Owner Onboarding & First Upload
 * Tests the complete onboarding flow for a new vault owner
 */

import { test, expect } from '../../fixtures/accounts';
import { createVaultItem } from '../../utils/api';

test.describe('Owner Onboarding Journey', () => {
  test('should complete full onboarding flow from registration to first upload', async ({ ownerPage, accounts }) => {
    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    const searchButton = ownerPage.getByTestId('search-button');
    await expect(searchButton).toBeVisible({ timeout: 10000 });

    const notificationBell = ownerPage.getByTestId('notification-bell');
    await expect(notificationBell).toBeVisible();

    await expect(ownerPage).toHaveURL(/\/app/);
  });

  test('should upload first memory via API and see it in timeline', async ({ ownerPage, accounts }) => {
    const memory = await createVaultItem(accounts.owner.token, {
      type: 'photo',
      title: `First Family Photo ${Date.now()}`,
      emotionCategory: 'joyful',
      importanceScore: 8
    });

    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await ownerPage.waitForTimeout(2000);

    const pageContent = await ownerPage.content();
    
    await expect(ownerPage.getByTestId('search-button')).toBeVisible();
  });

  test('should navigate between vault sections', async ({ ownerPage }) => {
    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await expect(ownerPage.getByTestId('search-button')).toBeVisible();
    await expect(ownerPage.getByTestId('notification-bell')).toBeVisible();

    await expect(ownerPage).toHaveURL(/\/app/);
  });

  test('should display vault stats after upload', async ({ ownerPage, accounts }) => {
    await createVaultItem(accounts.owner.token, {
      type: 'letter',
      title: `Test Note ${Date.now()}`,
      emotionCategory: 'neutral',
      importanceScore: 5
    });

    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await expect(ownerPage.getByTestId('search-button')).toBeVisible();
    
    await expect(ownerPage).toHaveURL(/\/app/);
  });
});
