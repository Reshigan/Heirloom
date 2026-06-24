// WCAG AA gate for The Deep grounds. Parses globals.css, resolves each text /
// dye-text token to RGB (over its ground for rgba alpha), asserts contrast
// >= 4.5:1. Run: node scripts/verify-deep-contrast.mjs
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../cloudflare/frontend/src/styles/globals.css', import.meta.url), 'utf8');

const DEEP = [7, 13, 20];         // #070d14 dark ground
const SHALLOWS = [238, 242, 246]; // #eef2f6 light ground

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const over = (fg, a, bg) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));

function resolve(val, ground) {
  val = val.trim();
  if (val.startsWith('#')) return hexToRgb(val.length === 4 ? val.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : val);
  const m = val.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => parseFloat(s));
  const [r, g, b] = parts;
  const a = parts.length > 3 ? parts[3] : 1;
  return over([r, g, b], a, ground);
}

const tok = (scope, name) => { const m = scope.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`)); return m ? m[1].trim() : null; };

const lightStart = css.indexOf('.loom[data-theme="light"] {');
const darkScope = css.slice(0, lightStart);
const lightScope = css.slice(lightStart);

let failures = 0;
const check = (label, val, ground) => {
  if (!val) { console.error('FAIL: missing token', label); failures++; return; }
  const rgb = resolve(val, ground);
  const ratio = contrast(rgb, ground);
  if (ratio < 4.5) { console.error(`FAIL: ${label} = ${val} -> ${ratio.toFixed(2)}:1 (need 4.5)`); failures++; }
  else console.log(`ok  ${label} ${ratio.toFixed(2)}:1`);
};

if (tok(darkScope, 'void') !== '#070d14') { console.error('FAIL: --void is not #070d14'); failures++; }
for (const t of ['bone', 'bone-dim', 'paper']) check(`dark ${t}`, tok(darkScope, t), DEEP);
for (const d of ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'])
  check(`dark dye-text ${d}`, tok(darkScope, `dye-${d}-text`), DEEP);

for (const d of ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'])
  check(`light dye-text ${d}`, tok(lightScope, `dye-${d}-text`), SHALLOWS);

if (failures) { console.error(`\n${failures} contrast check(s) failed.`); process.exit(1); }
console.log('\nAll AA contrast checks passed on deep + shallows.');
