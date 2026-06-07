/**
 * verify-cloth-nav — drives the real UI as a fresh user (no seeding) to confirm
 * this pass's changes:
 *   • the reading room carries the heirloom story when the cloth is bare
 *   • /loom/today renders the full woven cloth panel (canvas)
 *   • a real woven thread can be tapped on /loom/weft to open its entry
 *   • the reading room deep-links to ?entry=<id>
 *   • Settings suboptions resolve (the dead-man's-switch "configure →" no longer 404s)
 * Hits the production API via the dev server.
 */
import { test, expect, type Page } from '@playwright/test';

const stamp = Date.now();
const EMAIL = `clothnav+${stamp}@heirloom.test`;
const PASSWORD = 'VerifyPass1234';
const MEMORY_TITLE = `Cloth Nav Memory ${stamp}`;

async function signup(page: Page) {
  await page.goto('/signup');
  await page.locator('#s-thread').fill(`ClothNav Thread ${stamp}`);
  await page.locator('#s-first').fill('Cleo');
  await page.locator('#s-last').fill('Nav');
  await page.locator('#s-birth').fill('1980');
  await page.locator('#s-email').fill(EMAIL);
  await page.locator('#s-pw').fill(PASSWORD);
  await page.locator('#s-pw2').fill(PASSWORD);
  await page.getByRole('button', { name: /^Free/ }).click().catch(() => {});
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: /begin your thread/i }).click();
  await page.waitForTimeout(4000);
}

test.describe('cloth nav + story + settings', () => {
  test('story, today panel, tap-to-open, deep-link, settings suboptions', async ({ page }) => {
    test.setTimeout(150000);
    await signup(page);

    // ── Reading room tells the heirloom story while the cloth is bare ──────
    await page.goto('/loom/read');
    await expect(page.getByText('why heirloom exists')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/loses its stories twice/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /weave the first thread/i })).toBeVisible();

    // ── Today renders the full woven cloth panel ───────────────────────────
    await page.goto('/loom/today');
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

    // ── Weave a real memory so the cloth has a pick ────────────────────────
    await page.goto('/compose');
    await page.getByPlaceholder('A title — or leave it').fill(MEMORY_TITLE);
    await page.getByPlaceholder(/Write freely/i).fill('A small day that turned out to matter.');
    await page.getByRole('button', { name: /weave into cloth/i }).first().click();
    await page.waitForTimeout(4500);

    // ── Weft: hover the cloth to surface a thread, then tap it open ────────
    await page.goto('/loom/weft');
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // Sweep across the cloth until the readout exposes the tappable "open →".
    let opened = false;
    for (let i = 1; i <= 24 && !opened; i++) {
      const x = box.x + (box.width * i) / 25;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.waitForTimeout(80);
      if (await page.getByText('open →').isVisible().catch(() => false)) {
        await page.mouse.click(x, y);
        opened = true;
      }
    }
    expect(opened).toBe(true);

    // Tap landed in the reading room, deep-linked to the woven memory.
    await page.waitForURL(/\/loom\/read\?entry=/, { timeout: 10000 });
    await expect(page.getByText(MEMORY_TITLE).first()).toBeVisible({ timeout: 15000 });

    // ── Settings suboptions resolve (no NotFound) ──────────────────────────
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15000 });
    // The dead-man's-switch "configure →" used to point at /inherit (404).
    await page.getByRole('link', { name: /configure/i }).first().click();
    await page.waitForURL(/\/threads/, { timeout: 10000 });
    await expect(page.getByText(/page not found|404/i)).toHaveCount(0);
  });
});
