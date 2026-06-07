/**
 * verify-fixes — drives the real UI as a fresh user (no seeding) to confirm
 * this pass's changes: recipient autocomplete + add-new, the ∞ aggregate index,
 * the woven-cloth weft, and Family. Hits the production API via the dev server.
 */
import { test, expect, type Page } from '@playwright/test';

const stamp = Date.now();
const EMAIL = `verify+${stamp}@heirloom.test`;
const PASSWORD = 'VerifyPass1234';
const NEW_PERSON = `Verify Kin ${stamp}`;

async function signup(page: Page) {
  await page.goto('/signup');
  await page.locator('#s-thread').fill(`Verify Thread ${stamp}`);
  await page.locator('#s-first').fill('Vera');
  await page.locator('#s-last').fill('Ify');
  await page.locator('#s-birth').fill('1980');
  await page.locator('#s-email').fill(EMAIL);
  await page.locator('#s-pw').fill(PASSWORD);
  await page.locator('#s-pw2').fill(PASSWORD);
  // free tier — no card, no trial
  await page.getByRole('button', { name: /^Free/ }).click().catch(() => {});
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: /begin your thread/i }).click();
  // Register resolves -> vault modal appears; token is set either way.
  await page.waitForTimeout(4000);
}

test.describe('this-pass fixes', () => {
  test('signup, ∞ index, recipient autocomplete + add-new, weft cloth', async ({ page }) => {
    test.setTimeout(120000);
    await signup(page);

    // ── ∞ aggregate index ────────────────────────────────────────────────
    await page.goto('/loom/index');
    await expect(page.getByRole('button', { name: 'by time' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'by recipient' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'by mood' })).toBeVisible();
    // switching axis must not crash
    await page.getByRole('button', { name: 'by mood' }).click();
    await page.getByRole('button', { name: 'by recipient' }).click();

    // ── Letter composer: recipient autocomplete + add as family ──────────
    await page.goto('/loom/compose-letter');
    const forField = page.getByPlaceholder('a name (optional)');
    await expect(forField).toBeVisible();
    await forField.click();
    await forField.fill(NEW_PERSON);
    await expect(page.getByText(`add "${NEW_PERSON}" as`)).toBeVisible();
    await page.getByRole('button', { name: 'family' }).click();
    // After creation the field holds the new name and the add-row is gone.
    await expect(forField).toHaveValue(NEW_PERSON);
    await expect(page.getByText(`add "${NEW_PERSON}" as`)).toHaveCount(0);

    // ── Voice recorder: same person now autocompletes ────────────────────
    await page.goto('/record');
    const toField = page.getByPlaceholder('a name (optional)');
    await expect(toField).toBeVisible();
    await toField.click();
    await toField.fill(NEW_PERSON.slice(0, 10));
    // the newly-created family member should surface as a suggestion
    await expect(page.getByRole('button', { name: new RegExp(NEW_PERSON) }).first()).toBeVisible();

    // ── Family room shows the person, add controls present ───────────────
    await page.goto('/family');
    await expect(page.getByText(NEW_PERSON).first()).toBeVisible();

    // ── Weft renders the woven cloth canvas (not flat lines) ─────────────
    await page.goto('/loom/weft');
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

    // ── BottomNav contract: 5 items, ∞ → /loom/index ─────────────────────
    const nav = page.locator('nav[aria-label="Loom navigation"]');
    await expect(nav).toBeVisible();
    await expect(nav.locator('a[href="/loom/weft"]')).toBeVisible();
    await expect(nav.locator('a[href="/compose"]')).toBeVisible();
    await expect(nav.locator('a[href="/loom/index"]')).toBeVisible();
    await expect(nav.locator('a[href="/loom/letter"]')).toBeVisible();
    await expect(nav.locator('a[href="/record"]')).toBeVisible();
  });
});
