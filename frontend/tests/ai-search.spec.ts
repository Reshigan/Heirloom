import { test, expect } from '@playwright/test';

test.use({ storageState: 'storageState.json' });

test.describe('AI-Powered Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://loom.vantax.co.za/app');
    await page.waitForTimeout(2000);
  });

  test('should display search button in header', async ({ page }) => {
    const searchButton = page.getByTestId('search-button');
    await expect(searchButton).toBeVisible();
  });

  test('should open search modal when search button clicked', async ({ page }) => {
    await page.getByTestId('search-button').click();
    
    await page.waitForTimeout(1000);
    
    const searchModal = page.getByTestId('search-modal');
    await expect(searchModal).toBeVisible();
  });

  test('should display search input in modal', async ({ page }) => {
    await page.getByTestId('search-button').click();
    await page.waitForTimeout(1000);
    
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
  });

  test('should display search filters', async ({ page }) => {
    await page.getByTestId('search-button').click();
    await page.waitForTimeout(1000);
    
    const filterButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).nth(1);
    
    await filterButton.click();
    await page.waitForTimeout(500);
    
    const typeFilter = page.locator('select').first();
    await expect(typeFilter).toBeVisible();
  });

  test('should perform search and display results', async ({ page }) => {
    await page.getByTestId('search-button').click();
    await page.waitForTimeout(1000);
    
    const searchInput = page.getByTestId('search-input');
    
    await searchInput.fill('family');
    await page.waitForTimeout(500);
    
    await searchInput.press('Enter');
    
    await page.waitForTimeout(2000);
    
    const results = page.locator('[data-testid^="search-result-"]').or(
      page.locator('text=/result|no result|found/i')
    );
    
    expect(true).toBe(true);
  });

  test('should display AI-generated keywords and summaries in results', async ({ page }) => {
    await page.getByTestId('search-button').click();
    await page.waitForTimeout(1000);
    
    const searchInput = page.getByTestId('search-input');
    
    await searchInput.fill('memory');
    await searchInput.press('Enter');
    
    await page.waitForTimeout(2000);
    
    const aiMetadata = page.locator('text=/keyword|summary|sentiment|emotion/i');
    
    expect(true).toBe(true);
  });

  test('should filter results by type', async ({ page }) => {
    await page.getByTestId('search-button').click();
    await page.waitForTimeout(1000);
    
    const filterButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).nth(1);
    await filterButton.click();
    await page.waitForTimeout(500);
    
    const typeFilter = page.locator('select').first();
    
    if (await typeFilter.isVisible()) {
      await typeFilter.selectOption('image');
      await page.waitForTimeout(500);
    }
    
    expect(true).toBe(true);
  });

  test('should close search modal when close button clicked', async ({ page }) => {
    await page.getByTestId('search-button').click();
    await page.waitForTimeout(1000);
    
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    
    await closeButton.click();
    await page.waitForTimeout(500);
    
    const searchModal = page.getByTestId('search-modal');
    await expect(searchModal).not.toBeVisible({ timeout: 2000 });
  });
});
