// Regenerate the PWA manifest screenshots against the LIVE Deep app, reusing the
// seeded-auth + API-mock harness from live-seeded-shots.mjs. The old shots were
// from the retired cloth interface. Run:
//   cd cloudflare/frontend && node scripts/manifest-shots.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import { USER, resolve } from './live-seeded-shots.mjs';

const BASE = process.env.BASE || 'https://heirloom.blue';
const PUB = new URL('../public/', import.meta.url).pathname;

// [outfile, route, width, height] — sizes match manifest.webmanifest exactly.
const SHOTS = [
  ['screenshot-wide.png', '/loom/pwa', 1376, 768],
  ['screenshot-composer.png', '/compose', 1376, 768],
  ['screenshot-tree.png', '/loom/kin', 1376, 768],
  ['screenshot-narrow.png', '/loom/pwa', 768, 1376],
];

const b = await chromium.launch();
for (const [file, route, width, height] of SHOTS) {
  const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  await ctx.addInitScript(([u]) => {
    localStorage.setItem('token', 'faketoken');
    localStorage.setItem('refreshToken', 'fakeref');
    localStorage.setItem('heirloom-auth', JSON.stringify({ state: { user: u, isAuthenticated: true, _hasHydrated: true }, version: 0 }));
  }, [USER]);
  await ctx.route(/api\.heirloom\.blue/, async (r) => {
    const url = new URL(r.request().url());
    await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(resolve(url.pathname, url.search)) });
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
  await p.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => errs.push('NAV ' + e.message.slice(0, 80)));
  await p.waitForTimeout(2600); // let the water canvas settle + entries paint
  await p.screenshot({ path: PUB + file, fullPage: false });
  console.log(`wrote public/${file} (${width}×${height}) errs=${errs.length}${errs.length ? ' · ' + errs.slice(0, 2).join(' | ') : ''}`);
  await ctx.close();
}
await b.close();
