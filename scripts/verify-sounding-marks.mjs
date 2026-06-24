// Verifies the Sounding mark SVGs match BRAND §8 geometry. No deps — plain
// string/regex checks. Run: node scripts/verify-sounding-marks.mjs
import { readFileSync } from 'node:fs';

const DEEP = '#070d14';
const GOLD = '#e0a062';
const GOLD_CORE = '#f0c074';
const BONE = '#f2e6d0';
let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); failures++; } };

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const count = (s, sub) => s.split(sub).length - 1;

// Master 192
{
  const s = read('brand/mark/heirloom-sounding-192.svg');
  ok(s.includes('viewBox="0 0 192 192"'), '192: viewBox');
  ok(s.includes(`fill="${DEEP}"`), '192: deep ground');
  ok(count(s, '<circle') === 5, '192: five rings');
  ok(s.includes(`stroke="${GOLD}"`), '192: gold surface-line');
  ok(s.includes(`stroke="${GOLD_CORE}"`), '192: gold core line');
  ok(s.includes(`stroke="${BONE}"`), '192: bone rings');
  ok(!s.includes('∞') && !s.toLowerCase().includes('ember') && !s.includes('weft'), '192: no retired mark');
}
// Favicon 48
{
  const s = read('brand/mark/heirloom-sounding-favicon-48.svg');
  ok(s.includes('viewBox="0 0 48 48"'), 'fav: viewBox');
  ok(s.includes(`fill="${DEEP}"`), 'fav: deep ground');
  ok(count(s, '<circle') === 3, 'fav: three rings');
  ok(s.includes(`stroke="${GOLD}"`), 'fav: gold line');
}
// Maskable 512
{
  const s = read('brand/mark/heirloom-sounding-maskable-512.svg');
  ok(s.includes('viewBox="0 0 512 512"'), 'mask: viewBox');
  ok(s.includes(`fill="${DEEP}"`), 'mask: deep bleed');
  ok(count(s, '<circle') === 5, 'mask: five rings');
  ok(s.includes(`stroke="${GOLD}"`), 'mask: gold line');
}
// Lockup (shallows)
{
  const s = read('brand/mark/heirloom-sounding-lockup-shallows.svg');
  ok(s.includes('#eef2f6'), 'lockup: shallows ground');
  ok(s.includes('#3a5582'), 'lockup: indigo rings (reversed)');
  ok(s.includes(`stroke="${GOLD}"`), 'lockup: gold line unchanged');
  ok(s.includes('Heirloom'), 'lockup: wordmark');
  ok(s.includes('Fraunces'), 'lockup: Fraunces');
}
// OG card
{
  const s = read('brand/mark/heirloom-sounding-og.svg');
  ok(s.includes('viewBox="0 0 1200 630"'), 'og: viewBox');
  ok(s.includes(`fill="${DEEP}"`), 'og: deep ground');
  ok(s.includes('Heirloom'), 'og: wordmark');
}

if (failures) { console.error(`\n${failures} check(s) failed.`); process.exit(1); }
console.log('All Sounding mark checks passed.');
