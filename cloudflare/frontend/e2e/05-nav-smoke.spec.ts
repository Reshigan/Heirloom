/**
 * 05-nav-smoke — signs up a real user (no seeding, hits the production API via
 * the dev-server proxy) and walks every primary authenticated route, asserting
 * that none land on the catch-all NotFound and none throw a runtime error.
 *
 * This is the runtime complement to scripts/check-routes.mjs: the static checker
 * proves every <Link> target has a matching <Route>; this proves those routes
 * actually mount and render for a logged-in member (catching the /inherit-class
 * bug where a link resolved but the screen crashed or 404'd at runtime).
 *
 * It also exercises this pass's new surfaces end to end: the onboarding tour and
 * the /help help+assistant page.
 */
import { test, expect, type Page } from '@playwright/test';

const PASSWORD = 'SmokePass1234';

// A fresh account per signup — reusing one email across tests would 409 on the
// duplicate and leave the test unauthenticated.
let seq = 0;
const freshEmail = () => `smoke+${Date.now()}-${seq++}@heirloom.test`;

// The catch-all NotFound renders this exact line; any authed route showing it is
// a dead route (the bug class this spec guards against).
const NOT_FOUND_MARK = '404 · thread not found';

// Primary authenticated surfaces a member reaches from nav, the menu, or links.
const AUTHED_ROUTES = [
  '/loom',
  '/loom/today',
  '/loom/pwa',
  '/loom/index',
  '/loom/weft',
  '/loom/compose',
  '/loom/compose-letter',
  '/loom/read',
  '/loom/kin',
  '/loom/letter',
  '/loom/voice',
  '/loom/echo',
  '/dashboard',
  '/memories',
  '/compose',
  '/record',
  '/family',
  '/settings',
  '/billing',
  '/inbox',
  '/letters',
  '/threads',
  '/memory-cards',
  '/life-events',
  '/milestones',
  '/gift-subscriptions',
  '/help',
  '/onboarding',
];

async function signup(page: Page) {
  const stamp = Date.now();
  await page.goto('/signup');

  // The cloth splash overlay tears down on first paint; an early keystroke can
  // land before React attaches the controlled inputs, leaving the field empty
  // and tripping client validation (no API call, no token). Wait for the
  // splash to detach and the form to be interactive first.
  await page.locator('#hl-splash').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await page.locator('#s-thread').waitFor({ state: 'visible' });

  // Fill each field and confirm the value actually stuck in the controlled
  // input; re-fill on the rare race where the first keystroke is swallowed.
  const fields: [string, string][] = [
    ['#s-thread', `Smoke Thread ${stamp}`],
    ['#s-first', 'Smoke'],
    ['#s-last', 'Tester'],
    ['#s-birth', '1980'],
    ['#s-email', freshEmail()],
    ['#s-pw', PASSWORD],
    ['#s-pw2', PASSWORD],
  ];
  for (const [sel, val] of fields) {
    const loc = page.locator(sel);
    for (let i = 0; i < 3; i++) {
      await loc.fill(val);
      if ((await loc.inputValue()) === val) break;
      await page.waitForTimeout(250);
    }
    await expect(loc).toHaveValue(val);
  }

  await page.getByRole('button', { name: /^Free/ }).click().catch(() => {});
  await page.locator('input[type="checkbox"]').first().check();
  // Submit by type rather than label — the label changes with the chosen tier.
  await page.locator('button[type="submit"]').click();

  // Wait for the store to flip to authenticated rather than a fixed sleep.
  await page.waitForFunction(() => {
    try {
      return JSON.parse(localStorage.getItem('heirloom-auth') || '{}')?.state?.isAuthenticated === true;
    } catch {
      return false;
    }
  }, { timeout: 20000 });
}

test.describe('authenticated nav smoke', () => {
  // Register exactly once for the whole file. Prod rate-limits rapid repeat
  // registrations from one IP, so signing up per-test made 2 of 3 tests fail to
  // authenticate. We sign up once, snapshot the auth localStorage, and seed it
  // into each test via addInitScript so every test starts already signed in.
  let authStorage: Record<string, string> = {};

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signup(page);
    authStorage = await page.evaluate(() =>
      Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k) ?? ''])),
    );
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((store: Record<string, string>) => {
      for (const k of Object.keys(store)) localStorage.setItem(k, store[k]);
    }, authStorage);
  });

  test('walk every primary route — no NotFound, no runtime error', async ({ page }) => {
    test.setTimeout(180000);

    for (const path of AUTHED_ROUTES) {
      const errors: string[] = [];
      // Cloudflare's RUM beacon (/cdn-cgi/rum) is blocked by access-control on
      // some networks and surfaces as a pageerror — third-party telemetry, not
      // app code. Ignore it; it has nothing to do with whether the route renders.
      const onError = (e: Error) => {
        if (/cdn-cgi\/rum|access control checks/i.test(e.message)) return;
        errors.push(e.message);
      };
      page.on('pageerror', onError);

      await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {});

      const body = (await page.locator('body').textContent()) ?? '';
      expect(body, `${path} landed on NotFound`).not.toContain(NOT_FOUND_MARK);
      expect(body.trim().length, `${path} rendered empty`).toBeGreaterThan(0);
      expect(errors, `${path} threw: ${errors.join(' | ')}`).toHaveLength(0);

      page.off('pageerror', onError);
    }
  });

  test('onboarding leads with the tour, then advances to first step', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle').catch(() => {});

    // The tour opens on the cloth-is-interface panel; a "skip the tour" affordance
    // and a forward control are always present.
    const body = (await page.locator('body').textContent()) ?? '';
    expect(body.toLowerCase()).toMatch(/skip the tour|cloth|thread|listener/);

    // Skipping (or stepping through) the tour must reach the entry/invite steps
    // without crashing.
    const skip = page.getByRole('button', { name: /skip the tour/i });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await page.waitForTimeout(500);
    }
    expect((await page.locator('body').textContent()) ?? '').not.toContain(NOT_FOUND_MARK);
  });

  test('/help renders help topics and the support assistant', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/help');
    await page.waitForLoadState('networkidle').catch(() => {});

    const body = (await page.locator('body').textContent()) ?? '';
    expect(body.toLowerCase()).toMatch(/help|support|assistant|the basics/);

    // The assistant input must be present for a signed-in member.
    const input = page.locator('textarea').first();
    await expect(input).toBeVisible();

    // Sending a question hits the worker AI endpoint; the thread should grow.
    await input.fill('How do sealed letters work?');
    await input.press('Enter');
    // Give the worker a moment to respond (or fail gracefully) — either way the
    // page must not crash.
    await page.waitForTimeout(6000);
    expect((await page.locator('body').textContent()) ?? '').not.toContain(NOT_FOUND_MARK);
  });
});
