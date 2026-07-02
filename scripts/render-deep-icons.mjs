// Rasterizes the Drop mark SVGs into the frontend PWA icon set.
// Uses sharp-cli via npx (no committed dep). Run from repo root:
//   node scripts/render-deep-icons.mjs
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';

const MARK = 'brand/mark/heirloom-drop-192.svg';
const MASK = 'brand/mark/heirloom-drop-maskable-512.svg';
const FAV = 'brand/mark/heirloom-drop-favicon-48.svg';
const OG = 'brand/mark/heirloom-drop-og.svg';
const OUT = 'cloudflare/frontend/public';

const render = (src, dest, w, h) => {
  console.log(`render ${src} -> ${dest} (${w}x${h})`);
  execFileSync('npx', ['-y', 'sharp-cli', '--density', '384', '-i', src, '-o', dest, 'resize', String(w), String(h)], { stdio: 'inherit' });
};

render(MARK, `${OUT}/icons/icon-192.png`, 192, 192);
render(MARK, `${OUT}/icons/icon-512.png`, 512, 512);
render(MARK, `${OUT}/icons/apple-touch-icon.png`, 180, 180);
render(MASK, `${OUT}/icons/icon-maskable-192.png`, 192, 192);
render(MASK, `${OUT}/icons/icon-maskable-512.png`, 512, 512);
render(OG, `${OUT}/og-image.png`, 1200, 630);
copyFileSync(FAV, `${OUT}/favicon.svg`);
copyFileSync(MARK, `${OUT}/icon.svg`);
console.log('Deep icon set rendered.');
