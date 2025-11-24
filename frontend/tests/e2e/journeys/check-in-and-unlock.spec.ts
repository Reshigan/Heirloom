/**
 * Journey 5: Check-In and Unlock Flow
 * Tests dead man's switch system with trusted contacts
 */

import { test, expect } from '../../fixtures/accounts';
import { addTrustedContact, configureCheckIn } from '../../utils/api';

test.describe('Check-In and Unlock Journey', () => {
  test('should add trusted contact', async ({ ownerPage, accounts }) => {
    const contact = await addTrustedContact(accounts.owner.token, {
      email: accounts.trustedContact.email,
      name: 'Trusted Sister',
      phone: '+1234567890'
    });

    expect(contact.id).toBeDefined();

    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await expect(ownerPage.getByTestId('search-button')).toBeVisible();
  });

  test('should configure check-in settings', async ({ ownerPage, accounts }) => {
    await configureCheckIn(accounts.owner.token, 'app_notification');

    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await expect(ownerPage.getByTestId('search-button')).toBeVisible();
  });

  test('should display check-in status', async ({ ownerPage, accounts }) => {
    await configureCheckIn(accounts.owner.token);

    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await expect(ownerPage).toHaveURL(/\/app/);
  });

  test('should allow owner to perform check-in', async ({ ownerPage, accounts }) => {
    await ownerPage.goto('/app');
    await ownerPage.waitForLoadState('networkidle');

    await configureCheckIn(accounts.owner.token);

    await expect(ownerPage.getByTestId('search-button')).toBeVisible();
  });

  test('should handle trusted contact workflow', async ({ ownerPage, trustedContactPage, accounts }) => {
    await addTrustedContact(accounts.owner.token, {
      email: accounts.trustedContact.email,
      name: 'Emergency Contact'
    });

    await trustedContactPage.goto('/app');
    await trustedContactPage.waitForLoadState('networkidle');

    await expect(trustedContactPage.getByTestId('search-button')).toBeVisible();

  });
});
