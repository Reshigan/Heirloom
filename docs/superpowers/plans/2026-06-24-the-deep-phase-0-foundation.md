# The Deep — Phase 0: Foundation & Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-found the live Heirloom frontend on the "The Deep" brand — blue-water ground, the Sounding mark, the Fraunces/Source Serif 4/JetBrains Mono type stack, and a re-skinned PWA shell — without touching the water backdrop, routing, or any commercial/localization facts.

**Architecture:** Phase 0 is identity plumbing only. It rewrites the design tokens (`globals.css` + `tailwind.config.js` mirror), swaps the self-hosted font stack (`@fontsource` in `main.tsx` + `package.json`), authors the four Sounding-mark SVGs from BRAND §8 geometry, rasterizes them into the PWA icon set, and re-points the HTML head / splash / manifest / service worker to the deep ground. No React routes, components, or product surfaces change in Phase 0 — those are Phase 1. The single piece of real logic is a WCAG contrast verifier that proves every text + dye-text token clears AA on the new grounds; everything else is verified by the existing `npm run build` gate.

**Tech Stack:** React 18 + Vite + TS + Tailwind (`cloudflare/frontend`). Self-hosted fonts via `@fontsource`. SVG marks rasterized with `sharp-cli` via `npx` (no committed dependency). Plain Node ESM scripts for the SVG / manifest / contrast checks.

**Source of truth:** `brand/BRAND.md` (The Deep constitution) and `docs/superpowers/specs/2026-06-24-heirloom-ground-up-ui-design.md` (the spec). Where this plan quotes hex/geometry, it is copied from BRAND §6.3, §6.4, and §8.

**Standing constraints (do not violate):**
- Work on branch `rebrand-2026` only. Do NOT push to `main` or deploy live until the user approves.
- NEVER re-skin, blur, layer over, or otherwise modify the water backdrop (`src/loom/water/WaterCanvas.tsx`, `waterDyes.ts`, the shaders). "Leave the water design."
- Pricing is FROZEN: do not change any amount or the Founder field. ZAR localization is untouchable. Neither is touched by this plan.
- Commit after each task (the implementer commits its own work). Do not squash or rebase onto main.

---

## File Structure

**Created:**
- `brand/mark/heirloom-sounding-192.svg` — master Sounding mark (any-purpose app icon source)
- `brand/mark/heirloom-sounding-favicon-48.svg` — 16px-legible favicon source
- `brand/mark/heirloom-sounding-maskable-512.svg` — maskable PWA tile source
- `brand/mark/heirloom-sounding-lockup-shallows.svg` — horizontal lockup (light/Book)
- `brand/mark/heirloom-sounding-og.svg` — 1200×630 share-card source
- `scripts/verify-sounding-marks.mjs` — asserts each mark's geometry (rings, gold line, deep ground)
- `scripts/render-deep-icons.mjs` — rasterizes the marks into `public/` PNGs via `sharp-cli`
- `scripts/verify-deep-contrast.mjs` — WCAG AA verifier for text + dye-text tokens on both grounds
- `scripts/verify-manifest.mjs` — asserts manifest values match The Deep
- `cloudflare/frontend/src/loom/motion.ts` — the one calm spring + duration ladder constants

**Modified:**
- `cloudflare/frontend/src/styles/globals.css` — `:root` dark grounds → deep family; light → shallows; font vars
- `cloudflare/frontend/tailwind.config.js` — colour + fontFamily mirror
- `cloudflare/frontend/src/main.tsx` — `@fontsource` imports
- `cloudflare/frontend/package.json` — `@fontsource` deps
- `cloudflare/frontend/index.html` — head theme-color, splash, noscript, OG meta, font comment
- `cloudflare/frontend/public/manifest.webmanifest` — name/desc/colours/icons/shortcuts
- `cloudflare/frontend/public/sw.js` — `CACHE` bump + precache list
- `cloudflare/frontend/public/favicon.svg`, `public/icon.svg` — Sounding mark
- `cloudflare/frontend/public/icons/*.png`, `public/og-image.png` — regenerated rasters
- `brand/BRAND.md` — reconcile §8 "Shipped assets" filenames to the actual files

**Untouched (explicitly):** `src/loom/water/*`, all routes/pages, `dye.ts` (token values already match BRAND §6.4), worker, marketing automation, billing/pricing.

---

## Task 1: Author the Sounding mark SVGs

The files currently in `brand/mark/` are the **retired** Warp-and-Weft ember mark (warps/wefts/ember knot on `#0b0907`). They are stale and must be replaced with the Sounding mark per BRAND §8. We create new `-sounding-` files and delete the old ones.

**Files:**
- Create: `brand/mark/heirloom-sounding-192.svg`
- Create: `brand/mark/heirloom-sounding-favicon-48.svg`
- Create: `brand/mark/heirloom-sounding-maskable-512.svg`
- Create: `brand/mark/heirloom-sounding-lockup-shallows.svg`
- Create: `brand/mark/heirloom-sounding-og.svg`
- Create: `scripts/verify-sounding-marks.mjs`
- Delete (old ember marks): `brand/mark/heirloom-mark-192.svg`, `heirloom-favicon-48.svg`, `heirloom-maskable-512.svg`, `heirloom-lockup-vellum.svg`

- [ ] **Step 1: Write the failing geometry test**

Create `scripts/verify-sounding-marks.mjs`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/verify-sounding-marks.mjs`
Expected: FAIL — files do not exist yet (`ENOENT`).

- [ ] **Step 3: Author the five SVGs**

Create `brand/mark/heirloom-sounding-192.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192" role="img" aria-label="Heirloom">
  <title>Heirloom — the Sounding</title>
  <rect width="192" height="192" fill="#070d14"/>
  <g fill="none" stroke="#f2e6d0" stroke-width="3" stroke-linecap="round">
    <circle cx="96" cy="96" r="18" stroke-opacity="0.92"/>
    <circle cx="96" cy="96" r="34" stroke-opacity="0.72"/>
    <circle cx="96" cy="96" r="50" stroke-opacity="0.50"/>
    <circle cx="96" cy="96" r="66" stroke-opacity="0.32"/>
    <circle cx="96" cy="96" r="80" stroke-opacity="0.18"/>
  </g>
  <line x1="16" y1="96" x2="176" y2="96" stroke="#e0a062" stroke-width="4" stroke-linecap="round"/>
  <line x1="16" y1="96" x2="176" y2="96" stroke="#f0c074" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

Create `brand/mark/heirloom-sounding-favicon-48.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="Heirloom">
  <title>Heirloom</title>
  <rect width="48" height="48" fill="#070d14"/>
  <g fill="none" stroke="#f2e6d0" stroke-width="1.6" stroke-linecap="round">
    <circle cx="24" cy="24" r="6" stroke-opacity="0.92"/>
    <circle cx="24" cy="24" r="12" stroke-opacity="0.55"/>
    <circle cx="24" cy="24" r="18" stroke-opacity="0.28"/>
  </g>
  <line x1="4" y1="24" x2="44" y2="24" stroke="#e0a062" stroke-width="2" stroke-linecap="round"/>
</svg>
```

Create `brand/mark/heirloom-sounding-maskable-512.svg` (master geometry scaled ×2 and translated so the well centres at (256,256) and the outer ring r=160 sits inside the 80% safe circle r≈204.8):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Heirloom">
  <title>Heirloom — maskable tile</title>
  <rect width="512" height="512" fill="#070d14"/>
  <g transform="translate(64,64) scale(2)">
    <g fill="none" stroke="#f2e6d0" stroke-width="3" stroke-linecap="round">
      <circle cx="96" cy="96" r="18" stroke-opacity="0.92"/>
      <circle cx="96" cy="96" r="34" stroke-opacity="0.72"/>
      <circle cx="96" cy="96" r="50" stroke-opacity="0.50"/>
      <circle cx="96" cy="96" r="66" stroke-opacity="0.32"/>
      <circle cx="96" cy="96" r="80" stroke-opacity="0.18"/>
    </g>
    <line x1="16" y1="96" x2="176" y2="96" stroke="#e0a062" stroke-width="4" stroke-linecap="round"/>
    <line x1="16" y1="96" x2="176" y2="96" stroke="#f0c074" stroke-width="1.5" stroke-linecap="round"/>
  </g>
</svg>
```

Create `brand/mark/heirloom-sounding-lockup-shallows.svg` (reversed: indigo rings on shallows, gold line unchanged; mark scaled to ~96 tall beside the Fraunces wordmark):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="192" viewBox="0 0 640 192" role="img" aria-label="Heirloom">
  <title>Heirloom — lockup (shallows)</title>
  <rect width="640" height="192" fill="#eef2f6"/>
  <g transform="translate(0,48) scale(0.5)">
    <g fill="none" stroke="#3a5582" stroke-width="3" stroke-linecap="round">
      <circle cx="96" cy="96" r="18" stroke-opacity="0.92"/>
      <circle cx="96" cy="96" r="34" stroke-opacity="0.72"/>
      <circle cx="96" cy="96" r="50" stroke-opacity="0.50"/>
      <circle cx="96" cy="96" r="66" stroke-opacity="0.32"/>
      <circle cx="96" cy="96" r="80" stroke-opacity="0.18"/>
    </g>
    <line x1="16" y1="96" x2="176" y2="96" stroke="#e0a062" stroke-width="4" stroke-linecap="round"/>
    <line x1="16" y1="96" x2="176" y2="96" stroke="#f0c074" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <text x="128" y="120" font-family="Fraunces, Georgia, serif" font-size="80" font-weight="360" letter-spacing="-0.8" fill="#070d14">Heirloom</text>
</svg>
```

Create `brand/mark/heirloom-sounding-og.svg` (1200×630 share card, deep ground, centred mark + wordmark + tagline; bone text):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Heirloom — Some things only get deeper.">
  <title>Heirloom</title>
  <rect width="1200" height="630" fill="#070d14"/>
  <g transform="translate(504,140) scale(1)">
    <g fill="none" stroke="#f2e6d0" stroke-width="3" stroke-linecap="round">
      <circle cx="96" cy="96" r="18" stroke-opacity="0.92"/>
      <circle cx="96" cy="96" r="34" stroke-opacity="0.72"/>
      <circle cx="96" cy="96" r="50" stroke-opacity="0.50"/>
      <circle cx="96" cy="96" r="66" stroke-opacity="0.32"/>
      <circle cx="96" cy="96" r="80" stroke-opacity="0.18"/>
    </g>
    <line x1="16" y1="96" x2="176" y2="96" stroke="#e0a062" stroke-width="4" stroke-linecap="round"/>
    <line x1="16" y1="96" x2="176" y2="96" stroke="#f0c074" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <text x="600" y="430" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="84" font-weight="360" letter-spacing="-0.84" fill="#f2e6d0">Heirloom</text>
  <text x="600" y="492" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="34" font-style="italic" font-weight="360" fill="rgba(242,230,208,0.72)">Some things only get deeper.</text>
  <text x="600" y="560" text-anchor="middle" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="18" letter-spacing="3.6" fill="rgba(242,230,208,0.44)">HEIRLOOM.BLUE</text>
</svg>
```

- [ ] **Step 4: Delete the retired ember marks**

```bash
git rm brand/mark/heirloom-mark-192.svg brand/mark/heirloom-favicon-48.svg brand/mark/heirloom-maskable-512.svg brand/mark/heirloom-lockup-vellum.svg
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node scripts/verify-sounding-marks.mjs`
Expected: PASS — `All Sounding mark checks passed.`

- [ ] **Step 6: Reconcile BRAND.md §8 "Shipped assets" line**

In `brand/BRAND.md`, the "Shipped assets:" line near the end of §8 lists `heirloom-sounding-192.svg`, `heirloom-sounding-favicon-48.svg`, `heirloom-sounding-maskable-512.svg`, `heirloom-sounding-lockup-shallows.svg`. Add `heirloom-sounding-og.svg` to that list so it matches the files now on disk. Replace:

```
Shipped assets: `brand/mark/heirloom-sounding-192.svg`, `brand/mark/heirloom-sounding-favicon-48.svg`,
`brand/mark/heirloom-sounding-maskable-512.svg`, `brand/mark/heirloom-sounding-lockup-shallows.svg`.
```

with:

```
Shipped assets: `brand/mark/heirloom-sounding-192.svg`, `brand/mark/heirloom-sounding-favicon-48.svg`,
`brand/mark/heirloom-sounding-maskable-512.svg`, `brand/mark/heirloom-sounding-lockup-shallows.svg`,
`brand/mark/heirloom-sounding-og.svg`.
```

- [ ] **Step 7: Commit**

```bash
git add brand/mark/ scripts/verify-sounding-marks.mjs brand/BRAND.md
git commit -m "brand(mark): author the Sounding mark SVGs, retire ember marks

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Rasterize the marks into the PWA icon set

Generate the PNG icons the manifest and HTML head reference. Uses `sharp-cli` via `npx` — no committed dependency. The `?v=` query string on every icon URL is bumped in later tasks; the file bytes change here.

**Files:**
- Create: `scripts/render-deep-icons.mjs`
- Modify (overwrite): `cloudflare/frontend/public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `apple-touch-icon.png`
- Modify (overwrite): `cloudflare/frontend/public/favicon.svg`, `public/icon.svg`, `public/og-image.png`

- [ ] **Step 1: Write the renderer**

Create `scripts/render-deep-icons.mjs`:

```js
// Rasterizes the Sounding mark SVGs into the frontend PWA icon set.
// Uses sharp-cli via npx (no committed dep). Run from repo root:
//   node scripts/render-deep-icons.mjs
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';

const MARK = 'brand/mark/heirloom-sounding-192.svg';
const MASK = 'brand/mark/heirloom-sounding-maskable-512.svg';
const FAV = 'brand/mark/heirloom-sounding-favicon-48.svg';
const OG = 'brand/mark/heirloom-sounding-og.svg';
const OUT = 'cloudflare/frontend/public';

const render = (src, dest, w, h) => {
  console.log(`render ${src} -> ${dest} (${w}x${h})`);
  // sharp-cli: resize to exact pixels, density high enough that the SVG is crisp.
  execFileSync('npx', ['-y', 'sharp-cli', '--density', '384', '-i', src, '-o', dest, 'resize', String(w), String(h)], { stdio: 'inherit' });
};

// App icons (any-purpose) from the master mark.
render(MARK, `${OUT}/icons/icon-192.png`, 192, 192);
render(MARK, `${OUT}/icons/icon-512.png`, 512, 512);
render(MARK, `${OUT}/icons/apple-touch-icon.png`, 180, 180);
// Maskable from the safe-zone tile.
render(MASK, `${OUT}/icons/icon-maskable-192.png`, 192, 192);
render(MASK, `${OUT}/icons/icon-maskable-512.png`, 512, 512);
// OG share card.
render(OG, `${OUT}/og-image.png`, 1200, 630);
// SVG favicons are vector — copy straight through.
copyFileSync(FAV, `${OUT}/favicon.svg`);
copyFileSync(MARK, `${OUT}/icon.svg`);
console.log('Deep icon set rendered.');
```

- [ ] **Step 2: Run the renderer**

Run: `node scripts/render-deep-icons.mjs`
Expected: each `render ...` line prints, ends with `Deep icon set rendered.` (first `npx` invocation downloads `sharp-cli`, which can take ~30s).

If `npx sharp-cli` fails in the environment (no network / no native build), fall back to ImageMagick: `magick -background none -density 384 brand/mark/heirloom-sounding-192.svg -resize 192x192 cloudflare/frontend/public/icons/icon-192.png` (repeat per target). Document whichever path was used in the commit message.

- [ ] **Step 3: Verify the PNGs are the new mark**

Run: `node -e "const{readFileSync}=require('fs');for(const f of ['icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','og-image.png','favicon.svg']){const p='cloudflare/frontend/public/'+f;const b=readFileSync(p);if(b.length<200){console.error('FAIL tiny',f);process.exit(1)}}console.log('icons present, non-empty')"`
Expected: `icons present, non-empty`. Then open `cloudflare/frontend/public/icons/icon-512.png` visually (Read tool) and confirm it shows concentric bone rings with one gold line on deep ground — NOT the old weave/ember.

- [ ] **Step 4: Commit**

```bash
git add scripts/render-deep-icons.mjs cloudflare/frontend/public/icons/ cloudflare/frontend/public/favicon.svg cloudflare/frontend/public/icon.svg cloudflare/frontend/public/og-image.png
git commit -m "brand(pwa): rasterize Sounding mark into icon + OG set

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Colour tokens — deep grounds (dark) + shallows (light)

Re-point the ground ramp from warm-black `#0b0907` to deep-water `#070d14` (BRAND §6.3). The gold accent and the ten dyes are UNCHANGED (their hex already match BRAND §6.3/§6.4 — verified in the codebase). We add the missing `abyss`/`surface-plane`/`elevated`/`hover` plane tokens and flip the light theme ground to shallows `#eef2f6`.

There are three parallel ground families in `globals.css` that ALL render the dark ground and must move together or the old colour bleeds: `--void*`, the `--ink*` aliases, and (in light scope) the `--loom-*` set. The tailwind mirror (`void`, `ink`) moves in Task 3b.

**Files:**
- Modify: `cloudflare/frontend/src/styles/globals.css:13-21` (void ramp), `:79-91` (ink aliases), light scope `~:309-431`
- Modify: `cloudflare/frontend/tailwind.config.js:10-17` (void), `:63` (ink)
- Create: `scripts/verify-deep-contrast.mjs`

- [ ] **Step 1: Write the failing contrast test**

Create `scripts/verify-deep-contrast.mjs`. This is the BRAND §6.3 Phase-0 build gate — it parses the actual token values out of `globals.css` and asserts every text + dye-text token clears WCAG AA (4.5:1) against its ground.

```js
// WCAG AA gate for The Deep grounds (BRAND §6.3). Parses globals.css, resolves
// each text / dye-text token to RGB (over its ground for rgba alpha), and
// asserts contrast >= 4.5:1. Run: node scripts/verify-deep-contrast.mjs
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../cloudflare/frontend/src/styles/globals.css', import.meta.url), 'utf8');

const DEEP = [7, 13, 20];        // #070d14 dark ground
const SHALLOWS = [238, 242, 246]; // #eef2f6 light ground

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const over = (fg, a, bg) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));

// Resolve a CSS colour literal (#hex or rgba(...)) composited over `ground`.
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

// Pull a `--token: value;` from a given css scope substring.
const tok = (scope, name) => { const m = scope.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`)); return m ? m[1].trim() : null; };

// Scope slices: :root + dark are the default (deep); light scope after the marker.
const lightStart = css.indexOf('[data-theme="light"]');
const darkScope = css.slice(0, lightStart);
const lightScope = css.slice(lightStart);

let failures = 0;
const check = (label, val, ground, scope) => {
  if (!val) { console.error('FAIL: missing token', label); failures++; return; }
  const rgb = resolve(val, ground);
  const ratio = contrast(rgb, ground);
  if (ratio < 4.5) { console.error(`FAIL: ${label} = ${val} -> ${ratio.toFixed(2)}:1 (need 4.5)`); failures++; }
  else console.log(`ok  ${label} ${ratio.toFixed(2)}:1`);
};

// DARK / deep
check('deep ground token', tok(darkScope, 'void'), DEEP, 'dark');               // sanity: --void must be the deep hex
if (tok(darkScope, 'void') !== '#070d14') { console.error('FAIL: --void is not #070d14'); failures++; }
for (const t of ['bone', 'bone-dim', 'paper']) check(`dark ${t}`, tok(darkScope, t), DEEP);
for (const d of ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'])
  check(`dark dye-text ${d}`, tok(darkScope, `dye-${d}-text`), DEEP);

// LIGHT / shallows
for (const d of ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'])
  check(`light dye-text ${d}`, tok(lightScope, `dye-${d}-text`), SHALLOWS);

if (failures) { console.error(`\n${failures} contrast check(s) failed.`); process.exit(1); }
console.log('\nAll AA contrast checks passed on deep + shallows.');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/verify-deep-contrast.mjs`
Expected: FAIL — `--void is not #070d14` (still `#0b0907`). (Dye-text tokens already match BRAND §6.4 and should already pass once grounds move; the explicit `--void` assertion is the failing anchor.)

- [ ] **Step 3: Re-point the dark ground ramp in globals.css**

Replace `globals.css:15-20` (the `--void*` block):

```css
  --void-abyss: #090706;
  --void-deep: #090706;
  --void: #0b0907;
  --void-surface: #16110c;
  --void-elevated: #1e1812;
  --void-hover: #261e15;
```

with the deep-water ramp (BRAND §6.3):

```css
  /* DEEP — the blue-water ground (BRAND §6.3). near-black with a blue cast,
     sits *on* the kept water. Plane tokens lift toward the surface. */
  --void-abyss: #04080d;
  --void-deep: #04080d;
  --void: #070d14;
  --void-surface: #0c151f;
  --void-elevated: #122031;
  --void-hover: #182a40;
```

Then replace the `--ink*` alias block at `globals.css:79-91`:

```css
  --ink: #0b0907;
  --ink-card: #1b1610;
  --ink-deep: #090706;
```
```css
  --vignette-core: #15110c;
  --vignette-edge: #0b0907;
```
```css
  --ink-translucent: rgba(11, 9, 7, 0.78);
```
```css
  --dye-hero-edge: rgba(11, 9, 7, 0.52);
```

with deep equivalents:

```css
  --ink: #070d14;
  --ink-card: #122031;
  --ink-deep: #04080d;
```
```css
  --vignette-core: #0c151f;
  --vignette-edge: #070d14;
```
```css
  --ink-translucent: rgba(7, 13, 20, 0.78);
```
```css
  --dye-hero-edge: rgba(7, 13, 20, 0.52);
```

(Apply each as a separate exact replacement at its line; `bone`, `bone-dim`, `bone-faint` and all `--dye-*` values stay exactly as they are — they already match BRAND and the contrast test confirms them.)

- [ ] **Step 4: Flip the light theme ground to shallows**

In the `.loom[data-theme="light"]` scope (`globals.css` ~309-431), the light ground is currently `--ink: #f4ead9` (a warm parchment). BRAND §6.3 light is cool shallows `#eef2f6`. Replace the light-scope ground token:

```css
  --ink: #f4ead9;
```
with:
```css
  --ink: #eef2f6; /* shallows — cool water-light (BRAND §6.3) */
```

Also update the light splash/background references that hard-code the old parchment. Find any `#f4ead9` or `#faf3e4` used as the LIGHT page ground inside the light scope and change page-ground occurrences to `#eef2f6`. Leave `--bone` (light text `#120d08`) and the AA-lifted `--warm`/`--loom-warm` copper families as they are — they already clear AA and BRAND §6.3 keeps the dual-copper bridge.

> ponytail: do NOT chase every warm-tinted token in the light scope into blue. Only the *page ground* moves to shallows; cards/text/accent keep their AA-tuned values. Over-recolouring the light theme is Phase 4 sweep work, not Phase 0.

- [ ] **Step 5: Mirror the grounds in tailwind.config.js**

Replace `tailwind.config.js:10-17` (the `void` colour):

```js
        void: {
          abyss: '#090706',
          deep: '#090706',
          DEFAULT: '#0b0907',
          surface: '#16110c',
          elevated: '#1e1812',
          hover: '#261e15',
        },
```
with:
```js
        void: {
          abyss: '#04080d',
          deep: '#04080d',
          DEFAULT: '#070d14',
          surface: '#0c151f',
          elevated: '#122031',
          hover: '#182a40',
        },
```

And replace `tailwind.config.js:63`:

```js
        ink: '#0b0907',
```
with:
```js
        ink: '#070d14',
```

- [ ] **Step 6: Run the contrast test to verify it passes**

Run: `node scripts/verify-deep-contrast.mjs`
Expected: PASS — every `ok ... :1` line, then `All AA contrast checks passed on deep + shallows.`

- [ ] **Step 7: Run the build gate**

Run: `cd cloudflare/frontend && npm run build`
Expected: `tsc && vite build` exits 0 (no type errors; tokens are CSS-only).

- [ ] **Step 8: Commit**

```bash
git add cloudflare/frontend/src/styles/globals.css cloudflare/frontend/tailwind.config.js scripts/verify-deep-contrast.mjs
git commit -m "design(tokens): deep-water ground ramp + shallows light, AA-gated

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Font stack — Fraunces / Source Serif 4 / JetBrains Mono

Swap the type system to BRAND §6.2: **Fraunces** (display/voice), **Source Serif 4** (reading/prose/inputs), **JetBrains Mono** (archival/metadata), Inter retained (residual UI). Remove Cormorant Garamond, Spectral, Space Mono, Tangerine entirely.

**Files:**
- Modify: `cloudflare/frontend/package.json:28-32` (`@fontsource` deps)
- Modify: `cloudflare/frontend/src/main.tsx:12-32` (imports)
- Modify: `cloudflare/frontend/src/styles/globals.css:72-76` (`--font-*` vars) + the `--serif`/`--sans`/`--mono` vars
- Modify: `cloudflare/frontend/tailwind.config.js:93-107` (fontFamily)

- [ ] **Step 1: Update package.json dependencies**

Replace `package.json:28-32`:

```json
    "@fontsource/cormorant-garamond": "^5.2.11",
    "@fontsource/inter": "^5.2.8",
    "@fontsource/space-mono": "^5.2.9",
    "@fontsource/spectral": "^5.2.8",
    "@fontsource/tangerine": "^5.2.8",
```
with:
```json
    "@fontsource-variable/fraunces": "^5.2.5",
    "@fontsource-variable/source-serif-4": "^5.2.5",
    "@fontsource/inter": "^5.2.8",
    "@fontsource/jetbrains-mono": "^5.2.5",
```

(Fraunces and Source Serif 4 are variable fonts — the `@fontsource-variable/*` packages give one axis-rich file instead of per-weight statics, which suits BRAND §6.2's `opsz`/weight tuning.)

- [ ] **Step 2: Install the new font packages**

Run: `cd cloudflare/frontend && npm install`
Expected: lockfile updates; `node_modules/@fontsource-variable/fraunces` and `.../source-serif-4` and `@fontsource/jetbrains-mono` exist; the four removed packages are gone.

- [ ] **Step 3: Swap the @fontsource imports in main.tsx**

Replace `main.tsx:8-32` (the comment + all `@fontsource` import lines) with:

```ts
// Self-hosted typefaces (no render-blocking third-party font requests).
// BRAND §6.2 type system: Fraunces = display/voice (variable, opsz-aware),
// Source Serif 4 = reading/prose/inputs (variable), JetBrains Mono = archival
// labels/metadata, Inter = residual UI chrome.
import '@fontsource-variable/fraunces';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/source-serif-4/wght-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
```

- [ ] **Step 4: Update the font CSS variables in globals.css**

Replace `globals.css:72-76`:

```css
  --font-display: 'Cormorant Garamond', Charter, Georgia, serif;
  --font-body: 'Spectral', Charter, Georgia, serif;
  /* The one hand face — used ONLY at intimate moments (signoffs, dedications,
     the sealed-note "who", thread/member names). */
  --font-hand: 'Tangerine', 'Cormorant Garamond', 'Snell Roundhand', Georgia, cursive;
```
with:
```css
  --font-display: 'Fraunces Variable', 'Fraunces', Charter, Georgia, serif;
  --font-body: 'Source Serif 4 Variable', 'Source Serif 4', Charter, Georgia, serif;
  /* "hand" is now Source Serif 4 italic — the intimate prose voice (BRAND §6.2
     keeps no separate handwriting face; the Tangerine script is retired). */
  --font-hand: 'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif;
```

Then find the workhorse aliases lower in `:root` and re-point them. Search for `--serif:`, `--sans:`, `--mono:` and set:

```css
  --serif: 'Source Serif 4 Variable', 'Source Serif 4', Charter, Georgia, serif;
  --sans: 'Inter', system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, 'Space Mono', monospace;
```

(If `--serif` currently leads with Cormorant for "display drama," it now leads with Source Serif 4 — display drama belongs to `--font-display` only. Reading surfaces must never inherit the display face.)

- [ ] **Step 5: Update tailwind.config.js fontFamily**

Replace `tailwind.config.js:93-107` (the `fontFamily` block) with:

```js
      fontFamily: {
        // BRAND §6.2. Fraunces is DISPLAY ONLY (never below its ~24px optical
        // floor, never running body) — only `display` maps to it. Source Serif 4
        // is the reading workhorse; legacy `body`/`news`/`hand`/`loom-serif`
        // inherit it. JetBrains Mono carries archival labels/metadata.
        display: ['"Fraunces Variable"', '"Fraunces"', 'Charter', 'Georgia', 'serif'],
        body: ['"Source Serif 4 Variable"', '"Source Serif 4"', 'Charter', 'Georgia', 'serif'],
        hand: ['"Source Serif 4 Variable"', '"Source Serif 4"', 'Georgia', 'serif'],
        news: ['"Source Serif 4 Variable"', '"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
        v3mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        'loom-serif': ['"Source Serif 4 Variable"', '"Source Serif 4"', 'Charter', 'Georgia', 'serif'],
        'loom-ui': ['Inter', 'system-ui', 'sans-serif'],
        'loom-mono': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
```

- [ ] **Step 6: Grep for stale font references in active config**

Run: `grep -rn -iE "cormorant|spectral|tangerine|space mono|space-mono" cloudflare/frontend/src/main.tsx cloudflare/frontend/src/styles/globals.css cloudflare/frontend/tailwind.config.js cloudflare/frontend/package.json`
Expected: NO matches in `main.tsx`, `tailwind.config.js`, `package.json`. In `globals.css` the only allowed residual is `'Space Mono'` as a *fallback* inside `--mono` (after JetBrains Mono) — confirm any other Cormorant/Spectral/Tangerine occurrences are removed. (Component-level inline `font-family` strings in `.tsx`/`index.html` are handled in Task 5 and Phase 4 sweep — do not chase them here.)

- [ ] **Step 7: Run the build gate**

Run: `cd cloudflare/frontend && npm run build`
Expected: exits 0. The font packages resolve; CSS vars valid.

- [ ] **Step 8: Commit**

```bash
git add cloudflare/frontend/package.json cloudflare/frontend/package-lock.json cloudflare/frontend/src/main.tsx cloudflare/frontend/src/styles/globals.css cloudflare/frontend/tailwind.config.js
git commit -m "design(type): Fraunces / Source Serif 4 / JetBrains Mono stack

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: HTML head, splash & noscript → The Deep

Re-point `index.html` to the deep ground, the Fraunces type, the Sounding mark (replacing the bare `∞`), and refresh the OG/Twitter copy to the new positioning. The CSP forbids inline scripts (not inline styles), so inline `<style>` and inline SVG remain allowed.

**Files:**
- Modify: `cloudflare/frontend/index.html`

- [ ] **Step 1: Update the meta + boot styles**

- Line 5: bump the favicon cache-buster — `href="/favicon.svg?v=20260624deep"`.
- Line 7 `<meta name="description">` content → `Heirloom — a perpetual family archive owned by a bloodline, not a login. Lower a voice in today; a descendant draws it back up. Some things only get deeper.`
- Line 8 `<meta name="theme-color">` → `#eef2f6` stays correct for light default; ADD a dark counterpart immediately after:
```html
    <meta name="theme-color" content="#eef2f6" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#070d14" media="(prefers-color-scheme: dark)" />
```
(replace the single line 8 with these two.)
- Lines 20-21 boot substrate:
```css
      html { background: #0b0907; }
      html[data-theme="light"] { background: #faf3e4; }
```
→
```css
      html { background: #070d14; }
      html[data-theme="light"] { background: #eef2f6; }
```
- Line 26 apple-touch cache-buster → `?v=20260624deep`.
- Line 47 / 58 `og:image` / `twitter:image` cache-buster → `og-image.png?v=20260624deep`.
- Lines 45-46, 56-57 og/twitter title+description → title `Heirloom — some things only get deeper`, description `A perpetual family archive owned by a bloodline, not a login. Lower a voice in today; a descendant draws it back up — written, spoken, held at depth for as long as your family lasts.`
- Line 9 `<title>` → `Heirloom — some things only get deeper`.

- [ ] **Step 2: Replace the splash mark + fonts**

In the `#hl-splash` block (lines 65-98), replace the `font-family: 'Cormorant Garamond'...` on `#hl-splash` with `font-family: 'Fraunces Variable', 'Fraunces', Georgia, serif;`, change every splash colour literal from the old ground to deep (`#0b0907`→`#070d14`, light `#faf3e4`→`#eef2f6`, light text `#120d08` stays), and replace the `.hl-splash-mark` glyph block. Specifically swap the `<div class="hl-splash-mark">∞</div>` (line 94) for the inline Sounding mark:

```html
      <svg class="hl-splash-mark" width="84" height="84" viewBox="0 0 192 192" aria-hidden="true">
        <g fill="none" stroke="#f2e6d0" stroke-width="3" stroke-linecap="round">
          <circle cx="96" cy="96" r="18" stroke-opacity="0.92"/>
          <circle cx="96" cy="96" r="34" stroke-opacity="0.72"/>
          <circle cx="96" cy="96" r="50" stroke-opacity="0.50"/>
          <circle cx="96" cy="96" r="66" stroke-opacity="0.32"/>
          <circle cx="96" cy="96" r="80" stroke-opacity="0.18"/>
        </g>
        <line x1="16" y1="96" x2="176" y2="96" stroke="#e0a062" stroke-width="4" stroke-linecap="round"/>
        <line x1="16" y1="96" x2="176" y2="96" stroke="#f0c074" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
```

Remove the now-unused `#hl-splash .hl-splash-mark { font-size: 72px; ...; color: #e0a062; }` font rule (the SVG carries its own colour); keep the light-theme rule but it no longer needs the `color` override. Update `.hl-splash-word` to read in Fraunces italic (it already is italic) — change its `color` literals to the deep-theme bone (`rgba(242,230,208,0.58)` stays; light `rgba(18,13,8,0.58)` stays). Update `.hl-splash-label` font to `'JetBrains Mono', ui-monospace, monospace`. Change the splash label text (line 97) from `opening your cloth` to `sounding the deep`. Change the splash word (line 95) — keep `Heirloom`.

- [ ] **Step 3: Update the noscript block**

In the `<noscript>` block (lines 109-136): change ground literals `#0b0907`→`#070d14` and `#faf3e4`→`#eef2f6`; change the `.hl-noscript-mark` and `h1` `font-family` from Cormorant to `'Fraunces Variable', 'Fraunces', Georgia, serif`; change `p`/body font from Spectral to `'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif`. Replace the `<div class="hl-noscript-mark">∞</div>` (line 132) with the same inline Sounding SVG as Step 2 (it can reuse the markup). Update the copy: `h1` → `Heirloom needs JavaScript`; `p` → `The Deep is a living water surface — it needs JavaScript to open. Enable it, then reload to sound your family's depth.`

- [ ] **Step 4: Run the build gate**

Run: `cd cloudflare/frontend && npm run build`
Expected: exits 0; `dist/index.html` contains `#070d14` and `Fraunces`, no `Cormorant` / `∞` in the splash.

- [ ] **Step 5: Verify no stray old-ground / bare-mark in head**

Run: `grep -nE "0b0907|Cormorant|Spectral|>∞<|opening your cloth" cloudflare/frontend/index.html`
Expected: NO matches.

- [ ] **Step 6: Commit**

```bash
git add cloudflare/frontend/index.html
git commit -m "design(shell): index head/splash/noscript → The Deep + Sounding mark

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: PWA manifest → The Deep

Re-point the web manifest to the new name, positioning copy, deep colours, and cache-busted icons.

**Files:**
- Modify: `cloudflare/frontend/public/manifest.webmanifest`
- Create: `scripts/verify-manifest.mjs`

- [ ] **Step 1: Write the failing manifest test**

Create `scripts/verify-manifest.mjs`:

```js
// Asserts the PWA manifest matches The Deep. Run: node scripts/verify-manifest.mjs
import { readFileSync } from 'node:fs';
const m = JSON.parse(readFileSync(new URL('../cloudflare/frontend/public/manifest.webmanifest', import.meta.url), 'utf8'));
let f = 0;
const ok = (c, msg) => { if (!c) { console.error('FAIL:', msg); f++; } };
ok(m.background_color === '#070d14', 'background_color deep');
ok(m.theme_color === '#070d14', 'theme_color deep');
ok(!/thousand-year thread/i.test(m.name), 'name no longer "thousand-year thread"');
ok(/heirloom/i.test(m.name), 'name mentions Heirloom');
ok(m.icons.every((i) => /v=20260624deep/.test(i.src)), 'icons cache-busted');
ok(m.icons.some((i) => i.purpose === 'maskable'), 'maskable icon present');
if (f) { console.error(`${f} manifest check(s) failed.`); process.exit(1); }
console.log('Manifest matches The Deep.');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/verify-manifest.mjs`
Expected: FAIL — `background_color deep`, `theme_color deep`, name + cache-bust checks.

- [ ] **Step 3: Rewrite the manifest**

Overwrite `cloudflare/frontend/public/manifest.webmanifest`:

```json
{
  "name": "Heirloom — your family's Deep",
  "short_name": "Heirloom",
  "description": "A perpetual family archive owned by a bloodline, not a login. Lower a voice in today; a descendant draws it back up. Some things only get deeper.",
  "id": "/",
  "start_url": "/loom/pwa?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui"],
  "orientation": "natural",
  "background_color": "#070d14",
  "theme_color": "#070d14",
  "lang": "en",
  "dir": "ltr",
  "categories": ["lifestyle", "social", "productivity"],
  "icons": [
    { "src": "/icons/icon-192.png?v=20260624deep", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png?v=20260624deep", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-192.png?v=20260624deep", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png?v=20260624deep", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/icon.svg?v=20260624deep", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ],
  "shortcuts": [
    {
      "name": "Lower in a voice",
      "short_name": "Compose",
      "description": "Add to your family's Deep — written or spoken",
      "url": "/compose?source=pwa-shortcut",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Descend into the Deep",
      "short_name": "The Deep",
      "description": "Read down through what your family has kept",
      "url": "/loom/weft?source=pwa-shortcut",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    }
  ],
  "screenshots": [
    { "src": "/screenshot-wide.png", "sizes": "1376x768", "type": "image/png", "form_factor": "wide", "label": "The Deep — your family's kept water" },
    { "src": "/screenshot-composer.png", "sizes": "1376x768", "type": "image/png", "form_factor": "wide", "label": "Lower in a voice — write or speak today" },
    { "src": "/screenshot-tree.png", "sizes": "1376x768", "type": "image/png", "form_factor": "wide", "label": "The Bloodline — generations held at depth" },
    { "src": "/screenshot-narrow.png", "sizes": "768x1376", "type": "image/png", "form_factor": "narrow", "label": "The Deep — your family's kept water" }
  ]
}
```

> The `start_url`/shortcut routes (`/loom/pwa`, `/compose`, `/loom/weft`) are UNCHANGED — routing is Phase 1. Only labels/copy/colours move here.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/verify-manifest.mjs`
Expected: PASS — `Manifest matches The Deep.`

- [ ] **Step 5: Commit**

```bash
git add cloudflare/frontend/public/manifest.webmanifest scripts/verify-manifest.mjs
git commit -m "design(pwa): manifest → The Deep (name, copy, deep colours, icons)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Service-worker cache bump + precache

The browser byte-compares `sw.js`; the new identity assets only reach installed PWAs if the `CACHE` version changes. Bump it and add the new icon/og assets to the precache list.

**Files:**
- Modify: `cloudflare/frontend/public/sw.js:27` (`CACHE`), `:34-50` (`PRECACHE`)

- [ ] **Step 1: Bump the cache version**

In `cloudflare/frontend/public/sw.js`, find the `CACHE = 'heirloom-v191'` line (currently ~line 27) and bump it to the next version:

```js
const CACHE = 'heirloom-v192-deep';
```

- [ ] **Step 2: Add the new identity assets to PRECACHE**

In the `PRECACHE` array (~lines 34-50), ensure these are listed (add any missing, keeping existing entries):

```js
  '/favicon.svg?v=20260624deep',
  '/icon.svg?v=20260624deep',
  '/icons/icon-192.png?v=20260624deep',
  '/icons/icon-512.png?v=20260624deep',
  '/icons/icon-maskable-512.png?v=20260624deep',
  '/og-image.png?v=20260624deep',
```

(Match the existing array's quoting/trailing-comma style exactly. Remove any precache entry that points at a now-deleted asset.)

- [ ] **Step 3: Run the build gate**

Run: `cd cloudflare/frontend && npm run build`
Expected: exits 0. `sw.js` is copied to `dist/` verbatim (it is a public asset).

- [ ] **Step 4: Verify the bump**

Run: `grep -n "heirloom-v192-deep" cloudflare/frontend/public/sw.js`
Expected: one match on the `CACHE` line.

- [ ] **Step 5: Commit**

```bash
git add cloudflare/frontend/public/sw.js
git commit -m "chore(pwa): bump SW cache to v192-deep + precache identity assets

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Motion constants module

BRAND §7 fixes one calm spring (stiffness ~170, damping ~26) and the 180/360/720/1400ms duration ladder. Phase 1 surfaces (the rise/sink of entries, the Seal lower) will consume these. Create the single source of truth now so Phase 1 imports it rather than re-deriving magic numbers.

> ponytail: one tiny file, no animation runtime, no new dependency — just the constants BRAND already specifies. If Phase 1 finds it needs nothing more, this is complete; if it needs a `framer-motion`-style helper, add it there with a consumer in hand.

**Files:**
- Create: `cloudflare/frontend/src/loom/motion.ts`

- [ ] **Step 1: Write the module with an inline self-check**

Create `cloudflare/frontend/src/loom/motion.ts`:

```ts
/**
 * The Deep — motion constants (BRAND §7). One calm spring; things settle, never
 * bounce. Durations cluster at 180/360/720/1400ms. The metaphor is rise & sink:
 * entries SURFACE (rise from depth), notes SINK as they seal. The water itself
 * is untouched and perpetual — UI gestures breathe once and stop.
 *
 * Single source of truth so no surface re-invents these numbers.
 */

/** The one spring — entrances and layout. Settles without overshoot. */
export const SPRING = { stiffness: 170, damping: 26 } as const;

/** Micro-state transitions (hover, focus) reduce to this ease. */
export const MICRO = '220ms cubic-bezier(0.16, 1, 0.3, 1)';

/** The one easing curve (matches --ease in globals.css). */
export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Duration ladder (ms) — the only sanctioned durations. */
export const DUR = { fast: 180, mid: 360, slow: 720, ceremony: 1400 } as const;

/** True when the visitor asked for reduced motion — surfaces render at rest. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
```

- [ ] **Step 2: Verify it type-checks via the build gate**

Run: `cd cloudflare/frontend && npm run build`
Expected: exits 0. (The module is tree-shaken out until Phase 1 imports it — no runtime impact.)

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/loom/motion.ts
git commit -m "feat(motion): The Deep spring + duration ladder constants (BRAND §7)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

After all eight tasks, run the full Phase-0 gate from the repo root:

- [ ] `node scripts/verify-sounding-marks.mjs` → `All Sounding mark checks passed.`
- [ ] `node scripts/verify-deep-contrast.mjs` → `All AA contrast checks passed on deep + shallows.`
- [ ] `node scripts/verify-manifest.mjs` → `Manifest matches The Deep.`
- [ ] `cd cloudflare/frontend && npm run build` → exits 0
- [ ] `grep -rnE "0b0907|#16110c|#1e1812" cloudflare/frontend/src/styles/globals.css cloudflare/frontend/tailwind.config.js` → no matches (every old warm-black ground literal is gone from the token files; component-level literals are Phase 4 sweep)
- [ ] Visually open `cloudflare/frontend/public/icons/icon-512.png` (Read tool) and confirm the Sounding mark (rings + gold line on deep), not the retired weave.

**Not in Phase 0 (deliberately deferred):**
- BottomNav vocabulary + routes (`Today · The Deep · Bloodline · You`, Compose as gold action) — Phase 1, alongside the routes those words point at.
- The new shared component kit (descent-grid primitives, Listener, Prompt Deck) — built in Phase 1 with real consumers.
- Component-level inline colour/font literals across `.tsx` pages — Phase 4 sweep.
- Login screen, onboarding, marketing site — Phases 1 and 5.

---

## Self-review notes

- **Spec coverage:** Phase 0 of the spec = tokens (deep/shallows + planes ✓ Task 3), fonts (Fraunces/Source Serif 4/JetBrains Mono ✓ Task 4), Sounding marks + lockup + favicon/maskable/192/512/apple-touch ✓ Tasks 1–2, manifest + head theme/bg ✓ Tasks 5–6, OG/share image ✓ Tasks 1–2, motion springs ✓ Task 8, ProgressHair retained (untouched — no task needed), light + dye-on-deep AA re-verify ✓ Task 3 gate, sw.js cache bump ✓ Task 7. The shared kit is correctly pushed to Phase 1 (no consumers yet — building it now would be speculative per YAGNI).
- **Discovery correction:** `brand/mark/*.svg` were the retired ember mark, not the Sounding mark — Task 1 authors the real marks from §8 geometry rather than copying. BRAND §8 "Shipped assets" filenames reconciled in Task 1 Step 6.
- **Token reality:** the gold accent (`#e0a062`) and all ten dye / dye-text tokens already match BRAND §6.3/§6.4 — Task 3 only moves the grounds and proves AA holds on the new grounds; it does not touch the dyes.
- **Type consistency:** font tokens `--font-display`/`--font-body`/`--font-hand`/`--serif`/`--sans`/`--mono` and the tailwind `display/body/hand/news/v3mono/loom-*` keys are all updated together in Task 4; the cache-bust string `v=20260624deep` is used identically across index.html, manifest, and sw.js.
```