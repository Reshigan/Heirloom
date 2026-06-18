#!/usr/bin/env node
/**
 * generate-og-cards.mjs — render the four content-card Open Graph images.
 *
 * Heirloom ships ONE static OG card plus four per-surface content cards that
 * are unfurled by the Cloudflare Pages OG injector (functions/_shared/og.ts).
 * Those four had been byte-identical placeholder duplicates. This script
 * renders each as a DISTINCT, on-brand 1200x630 PNG by screenshotting an HTML
 * template with Playwright (chromium, the frontend devDependency).
 *
 * Constitution (ART_DIRECTION.md): dark ground #0b0907, cream type #f2e6d0,
 * copper #e0a062 as SIGNAL only (a single hairline weft + the ∞ mark, well
 * under 3% surface), rule rgba(242,230,208,0.11). Cormorant Garamond display
 * title (>=24px), Space Mono uppercase eyebrow, Spectral body line. The only
 * mark is ∞. No icons, no emoji, no gradients-mesh/glass, no rounded corners.
 *
 * Titles/eyebrow words mirror cloudflare/frontend/functions/_shared/og.ts so
 * the picture matches the copy each share link unfurls with.
 *
 * Idempotent: re-running overwrites the four PNGs deterministically.
 *
 * Usage:  node scripts/generate-og-cards.mjs
 */

import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FRONTEND = join(REPO_ROOT, 'cloudflare', 'frontend');

// playwright is a devDependency of the frontend, not the repo root. Resolve it
// from there explicitly so the script runs regardless of cwd.
const requireFromFrontend = createRequire(join(FRONTEND, 'package.json'));
const { chromium } = requireFromFrontend('playwright');
const ASSET_DIR = join(FRONTEND, 'dist', 'assets');
const OUT_DIR = join(FRONTEND, 'public', 'og');

// Resolve the exact hashed woff2 filenames at runtime (Vite content-hashes them).
function resolveFont(prefix) {
  const files = readdirSync(ASSET_DIR);
  const match = files.find((f) => f.startsWith(prefix) && f.endsWith('.woff2'));
  if (!match) throw new Error(`font not found for prefix ${prefix} in ${ASSET_DIR}`);
  return pathToFileURL(join(ASSET_DIR, match)).href;
}

const FONTS = {
  cormorant400: resolveFont('cormorant-garamond-latin-400-normal-'),
  cormorant600: resolveFont('cormorant-garamond-latin-600-normal-'),
  spectral400: resolveFont('spectral-latin-400-normal-'),
  spectral500: resolveFont('spectral-latin-500-normal-'),
  mono400: resolveFont('space-mono-latin-400-normal-'),
  mono700: resolveFont('space-mono-latin-700-normal-'),
};

const fontFace = `
  @font-face { font-family:'Cormorant'; src:url('${FONTS.cormorant400}') format('woff2'); font-weight:400; font-style:normal; font-display:block; }
  @font-face { font-family:'Cormorant'; src:url('${FONTS.cormorant600}') format('woff2'); font-weight:600; font-style:normal; font-display:block; }
  @font-face { font-family:'Spectral'; src:url('${FONTS.spectral400}') format('woff2'); font-weight:400; font-style:normal; font-display:block; }
  @font-face { font-family:'Spectral'; src:url('${FONTS.spectral500}') format('woff2'); font-weight:500; font-style:normal; font-display:block; }
  @font-face { font-family:'SpaceMono'; src:url('${FONTS.mono400}') format('woff2'); font-weight:400; font-style:normal; font-display:block; }
  @font-face { font-family:'SpaceMono'; src:url('${FONTS.mono700}') format('woff2'); font-weight:700; font-style:normal; font-display:block; }
`;

// Palette (constitution canon).
const INK = '#0b0907';
const BONE = '#f2e6d0';
const BONE_DIM = 'rgba(242,230,208,0.72)';
const BONE_FAINT = 'rgba(242,230,208,0.44)';
const RULE = 'rgba(242,230,208,0.11)';
const WARM = '#e0a062';

/**
 * Distinct woven motif per surface. Each is a faint cream warp field (the
 * cloth) plus ONE copper hairline weft thread positioned differently, so the
 * four cards read as four different moments in one fabric. Copper stays a
 * single ~1px line + the small ∞ mark = well under 3% surface.
 *
 * motif: 'rising' | 'meeting' | 'severed' | 'opening'
 */
function clothLayer(motif) {
  // Faint vertical warp threads — the standing cloth, identical family fabric.
  const warpCount = 26;
  const warps = [];
  for (let i = 0; i < warpCount; i++) {
    const x = (1200 / (warpCount + 1)) * (i + 1);
    warps.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="630" stroke="${RULE}" stroke-width="1"/>`
    );
  }

  // The single copper weft — drawn differently per surface.
  let weft = '';
  let faintWefts = '';

  if (motif === 'rising') {
    // inherit — a thread set aside, climbing toward the reader from the lower left.
    weft = `<line x1="0" y1="560" x2="1200" y2="300" stroke="${WARM}" stroke-width="1.5"/>`;
    faintWefts = [470, 530].map(
      (y) => `<line x1="0" y1="${y + 60}" x2="1200" y2="${y - 60}" stroke="${BONE_FAINT}" stroke-width="1" opacity="0.5"/>`
    ).join('');
  } else if (motif === 'meeting') {
    // wrapped — a year added: the weft completes a full horizontal pass, low band.
    weft = `<line x1="0" y1="500" x2="1200" y2="500" stroke="${WARM}" stroke-width="1.5"/>`;
    faintWefts = [440, 470, 530].map(
      (y) => `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="${BONE_FAINT}" stroke-width="1" opacity="0.55"/>`
    ).join('');
  } else if (motif === 'severed') {
    // milestone/memorial — a life remembered: one weft ends, then resumes,
    // carried forward across a gap. Dignified, centered.
    weft =
      `<line x1="0" y1="510" x2="540" y2="510" stroke="${WARM}" stroke-width="1.5"/>` +
      `<line x1="660" y1="510" x2="1200" y2="510" stroke="${WARM}" stroke-width="1.5"/>` +
      `<circle cx="600" cy="510" r="2.5" fill="${WARM}"/>`;
    faintWefts = [560, 600].map(
      (y) => `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="${BONE_FAINT}" stroke-width="1" opacity="0.5"/>`
    ).join('');
  } else {
    // opening — entry/memory room: the warp parts to open a doorway; weft on
    // the right margin marks the room set aside.
    weft = `<line x1="980" y1="120" x2="980" y2="510" stroke="${WARM}" stroke-width="1.5"/>`;
    faintWefts = [430, 470, 510].map(
      (y) => `<line x1="120" y1="${y}" x2="900" y2="${y}" stroke="${BONE_FAINT}" stroke-width="1" opacity="0.5"/>`
    ).join('');
  }

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg"
         style="position:absolute;inset:0;">
      <g opacity="0.6">${warps.join('')}</g>
      ${faintWefts}
      ${weft}
    </svg>`;
}

function template({ eyebrow, title, body, motif }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:1200px;height:630px;}
    ${fontFace}
    .card{
      position:relative;width:1200px;height:630px;background:${INK};overflow:hidden;
    }
    .content{
      position:relative;z-index:2;height:100%;
      padding:96px 110px;display:flex;flex-direction:column;
      justify-content:flex-end;
    }
    .eyebrow{
      font-family:'SpaceMono',monospace;font-weight:400;text-transform:uppercase;
      letter-spacing:0.42em;font-size:20px;color:${WARM};
      margin-bottom:36px;
    }
    .title{
      font-family:'Cormorant',serif;font-weight:600;color:${BONE};
      font-size:84px;line-height:1.02;letter-spacing:-0.005em;
      max-width:880px;
    }
    .body{
      font-family:'Spectral',serif;font-weight:400;color:${BONE_DIM};
      font-size:25px;line-height:1.45;max-width:680px;margin-top:34px;
    }
    .mark{
      position:absolute;z-index:3;top:84px;left:110px;
      font-family:'Cormorant',serif;font-weight:400;color:${WARM};
      font-size:46px;line-height:1;
    }
    .wordmark{
      position:absolute;z-index:3;top:96px;right:110px;
      font-family:'SpaceMono',monospace;font-weight:700;text-transform:uppercase;
      letter-spacing:0.34em;font-size:17px;color:${BONE_FAINT};
    }
  </style></head><body>
    <div class="card">
      ${clothLayer(motif)}
      <div class="mark">&#8734;</div>
      <div class="wordmark">Heirloom</div>
      <div class="content">
        <div class="eyebrow">${eyebrow}</div>
        <div class="title">${title}</div>
        <div class="body">${body}</div>
      </div>
    </div>
  </body></html>`;
}

// Titles + bodies kept consistent with functions/_shared/og.ts.
const CARDS = [
  {
    file: 'inherit.png',
    motif: 'rising',
    eyebrow: 'A Thread Set Aside',
    title: 'Someone has been writing to you.',
    body: 'A thread was set aside for you to read when the time came.',
  },
  {
    file: 'wrapped.png',
    motif: 'meeting',
    eyebrow: 'The Thread Continues',
    title: 'A year, added to a family thread.',
    body: 'Every entry is permanent and in order. The thread continues after us.',
  },
  {
    file: 'milestone.png',
    motif: 'severed',
    eyebrow: 'In Memory',
    title: 'A life is remembered here.',
    body: 'A memorial kept inside a perpetual family thread — meant to be carried forward.',
  },
  {
    file: 'entry.png',
    motif: 'opening',
    eyebrow: 'A Room Opened For You',
    title: 'A room in a family thread has been opened for you.',
    body: 'Someone shared a place where their family’s story is kept.',
  },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  for (const card of CARDS) {
    const html = template(card);
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const target = join(OUT_DIR, card.file);
    await page.screenshot({
      path: target,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
      type: 'png',
    });
    console.log(`rendered ${card.file}  (${card.motif})`);
  }

  await browser.close();
  console.log(`\nDone — 4 cards written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
