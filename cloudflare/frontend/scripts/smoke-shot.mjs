// Headless smoke: load live routes with a COLD cache (no SW, no storage),
// screenshot, and report the rendered <title>, main bundle, and any console errors.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'https://heirloom.blue';
const OUT = '/private/tmp/heirloom-shots';
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ['home', '/'],
  ['pricing', '/pricing'],
  ['signup', '/signup'],
  ['onboarding', '/onboarding'],
  ['threshold', '/loom/threshold'],
  ['marketing', '/loom/marketing'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  serviceWorkers: 'block',
});
for (const [name, path] of ROUTES) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  const resp = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => ({ _err: e.message }));
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`${name.padEnd(10)} status=${resp?.status?.() ?? resp?._err ?? '?'} errs=${errors.length}`);
  await page.close();
}
await browser.close();
console.log('shots →', OUT);
