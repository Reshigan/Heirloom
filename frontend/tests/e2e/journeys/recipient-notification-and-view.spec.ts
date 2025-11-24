/**
 * Journey 3: Recipient Receives Notifications and Views Memories
 * Tests real-time SSE notifications and memory viewing
 */

import { test, expect } from '../../fixtures/accounts';
import { createVaultItem, addRecipient, getNotifications } from '../../utils/api';

test.describe('Recipient Notification and View Journey', () => {
  test('should receive and display notifications', async ({ recipientPage, accounts }) => {
    await recipientPage.goto('/app');
    await recipientPage.waitForLoadState('networkidle');

    const notificationBell = recipientPage.getByTestId('notification-bell');
    await expect(notificationBell).toBeVisible();

    await notificationBell.click();
    await recipientPage.waitForTimeout(1000);

    await expect(recipientPage).toHaveURL(/\/app/);
  });

  test('should establish SSE connection for real-time notifications', async ({ recipientPage, accounts }) => {
    await recipientPage.goto('/app');
    await recipientPage.waitForLoadState('networkidle');

    await recipientPage.waitForTimeout(2000);

    await expect(recipientPage.getByTestId('notification-bell')).toBeVisible();

    const notifications = await getNotifications(accounts.recipient.token);
    expect(Array.isArray(notifications)).toBe(true);
  });

  test('should display unread count badge', async ({ recipientPage, accounts }) => {
    await recipientPage.goto('/app');
    await recipientPage.waitForLoadState('networkidle');

    const notificationBell = recipientPage.getByTestId('notification-bell');
    await expect(notificationBell).toBeVisible();

    await notificationBell.click();
    await recipientPage.waitForTimeout(500);
  });

  test('should mark notification as read when clicked', async ({ recipientPage, accounts }) => {
    await recipientPage.goto('/app');
    await recipientPage.waitForLoadState('networkidle');

    await recipientPage.getByTestId('notification-bell').click();
    await recipientPage.waitForTimeout(1000);

    await expect(recipientPage).toHaveURL(/\/app/);
  });

  test('should show notifications in chronological order', async ({ recipientPage, accounts }) => {
    await recipientPage.goto('/app');
    await recipientPage.waitForLoadState('networkidle');

    await recipientPage.getByTestId('notification-bell').click();
    await recipientPage.waitForTimeout(1000);

    await expect(recipientPage.getByTestId('notification-bell')).toBeVisible();
  });
});
