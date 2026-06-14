// Headless pixel/render audit — visit every route, flag console errors,
// uncaught exceptions, and blank/near-empty renders. Screenshots → /tmp/audit.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:4173';
const OUT = '/tmp/audit';
fs.mkdirSync(OUT, { recursive: true });

const routes = fs.readFileSync('/tmp/routes.txt', 'utf8')
  .split('\n').map(s => s.trim()).filter(Boolean)
  .map(r => r.replace(/:(\w+)/g, 'demo')); // fill params with 'demo'

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });

const report = [];
for (const route of routes) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('UNCAUGHT: ' + e.message.slice(0, 200)));
  let status = 'ok', textLen = 0, bg = '';
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(600);
    textLen = (await page.evaluate(() => document.body?.innerText || '')).trim().length;
    bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    if (textLen < 5) status = 'BLANK';
    const safe = route.replace(/\//g, '_') || '_root';
    await page.screenshot({ path: path.join(OUT, safe + '.png'), fullPage: false });
  } catch (e) {
    status = 'NAV-FAIL: ' + e.message.slice(0, 120);
  }
  // ignore benign noise
  const real = errors.filter(e =>
    !/favicon|manifest|sw\.js|ServiceWorker|net::ERR_|Failed to load resource.*(401|403|404)|api\//i.test(e));
  report.push({ route, status, textLen, bg, errs: real.length, sample: real[0] || '' });
  await page.close();
}
await browser.close();

// print
const bad = report.filter(r => r.status !== 'ok' || r.errs > 0);
console.log(`\n=== ${report.length} routes audited ; ${bad.length} flagged ===\n`);
for (const r of report) {
  const flag = (r.status !== 'ok' || r.errs > 0) ? '⚠️ ' : '   ';
  console.log(`${flag}${r.status.padEnd(10)} txt=${String(r.textLen).padStart(5)} err=${r.errs} ${r.route}${r.sample ? '  | ' + r.sample : ''}`);
}
fs.writeFileSync('/tmp/audit/report.json', JSON.stringify(report, null, 2));
