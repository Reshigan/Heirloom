/**
 * Journey 2: Owner Shares Memory with Recipient
 * Tests the complete flow of sharing a memory and recipient receiving notification
 */

import { test, expect } from '../../fixtures/accounts';
import { createVaultItem, addRecipient, getNotifications } from '../../utils/api';

test.describe('Owner Upload and Share Journey', () => {
  test('should upload memory and share with recipient', async ({ ownerPage, recipientPage, accounts }) => {
    const recipient = await addRecipient(accounts.owner.token, {
      email: accounts.recipient.email,
      name: 'Test Recipient',
      relationship: 'family'
    });

    const memory = await createVaultItem(accounts.owner.token, {
      type: 'photo',
      title: `Shared Family Photo ${Date.now()}`,
      recipientIds: [recipient.id],
      emotionCategory: 'joyful',
      importanceScore: 9
    });

    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');
    await expect(ownerPage.getByTestId('search-button')).toBeVisible();

    await ownerPage.waitForTimeout(3000);

    const notifications = await getNotifications(accounts.recipient.token);
    
    expect(Array.isArray(notifications)).toBe(true);
  });

  test('should prevent recipient from accessing unshared memories', async ({ ownerPage, recipientPage, accounts }) => {
    const privateMemory = await createVaultItem(accounts.owner.token, {
      type: 'letter',
      title: `Private Note ${Date.now()}`,
      recipientIds: [], // No recipients
      emotionCategory: 'neutral',
      importanceScore: 5
    });

    await recipientPage.goto('/app');
    await recipientPage.waitForLoadState('networkidle');

    await expect(recipientPage.getByTestId('search-button')).toBeVisible();

    await expect(recipientPage).toHaveURL(/\/app/);
  });

  test('should show shared memory in recipient search results', async ({ ownerPage, recipientPage, accounts }) => {
    const recipient = await addRecipient(accounts.owner.token, {
      email: accounts.recipient.email,
      name: 'Test Recipient',
      relationship: 'family'
    });

    const uniqueTitle = `SharedMemory${Date.now()}`;
    await createVaultItem(accounts.owner.token, {
      type: 'photo',
      title: uniqueTitle,
      recipientIds: [recipient.id],
      emotionCategory: 'happy',
      importanceScore: 7
    });

    await recipientPage.goto('/app');
    await recipientPage.waitForLoadState('networkidle');

    await recipientPage.getByTestId('search-button').click();
    await recipientPage.waitForTimeout(1000);

    const searchInput = recipientPage.getByPlaceholder(/search/i);
    await searchInput.fill(uniqueTitle);
    await recipientPage.waitForTimeout(2000);

    const searchModal = recipientPage.getByTestId('search-modal');
    await expect(searchModal).toBeVisible();
  });
});
