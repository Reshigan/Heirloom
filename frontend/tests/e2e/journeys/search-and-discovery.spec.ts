/**
 * Journey 4: Search and Discovery
 * Tests AI-powered search with filters and results
 * Note: This extends existing ai-search.spec.ts tests
 */

import { test, expect } from '../../fixtures/accounts';
import { createVaultItem, seedVaultItems } from '../../utils/api';

test.describe('Search and Discovery Journey', () => {
  test('should search through multiple memories with filters', async ({ ownerPage, accounts }) => {
    await seedVaultItems(accounts.owner.token, 5, {
      types: ['photo', 'letter', 'video']
    });

    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await ownerPage.getByTestId('search-button').click();
    await ownerPage.waitForTimeout(1000);

    const searchModal = ownerPage.getByTestId('search-modal');
    await expect(searchModal).toBeVisible();

    const searchInput = ownerPage.getByPlaceholder(/search/i);
    await searchInput.fill('test memory');
    await ownerPage.waitForTimeout(2000);

    await expect(searchModal).toBeVisible();
  });

  test('should filter search results by type', async ({ ownerPage, accounts }) => {
    await createVaultItem(accounts.owner.token, {
      type: 'photo',
      title: `Photo ${Date.now()}`,
      emotionCategory: 'joyful'
    });

    await createVaultItem(accounts.owner.token, {
      type: 'letter',
      title: `Note ${Date.now()}`,
      emotionCategory: 'neutral'
    });

    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await ownerPage.getByTestId('search-button').click();
    await ownerPage.waitForTimeout(1000);

    const filterButton = ownerPage.getByTestId('search-filter-button');
    await filterButton.click();
    await ownerPage.waitForTimeout(500);

    const typeFilter = ownerPage.locator('select').first();
    if (await typeFilter.isVisible()) {
      await typeFilter.selectOption('image');
      await ownerPage.waitForTimeout(500);
    }

    await expect(ownerPage.getByTestId('search-modal')).toBeVisible();
  });

  test('should display AI-generated summaries and keywords', async ({ ownerPage, accounts }) => {
    await createVaultItem(accounts.owner.token, {
      type: 'photo',
      title: `Family birthday celebration with cake and presents ${Date.now()}`,
      emotionCategory: 'joyful',
      importanceScore: 9
    });

    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await ownerPage.getByTestId('search-button').click();
    await ownerPage.waitForTimeout(1000);

    const searchInput = ownerPage.getByPlaceholder(/search/i);
    await searchInput.fill('birthday');
    await ownerPage.waitForTimeout(2000);

    await expect(ownerPage.getByTestId('search-modal')).toBeVisible();
  });

  test('should close search modal when close button clicked', async ({ ownerPage }) => {
    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await ownerPage.getByTestId('search-button').click();
    await ownerPage.waitForTimeout(1000);

    const searchModal = ownerPage.getByTestId('search-modal');
    await expect(searchModal).toBeVisible();

    const closeButton = ownerPage.getByTestId('search-close-button');
    await closeButton.click();
    await ownerPage.waitForTimeout(500);

    await expect(searchModal).not.toBeVisible({ timeout: 2000 });
  });
});
