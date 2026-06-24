/**
 * Heirloom — Warp-and-Weft icon generator (2026 brand)
 *
 * Rasterises the canonical Warp-and-Weft mark to the PWA PNG set. Geometry is
 * copied verbatim from brand/BRAND.md §8 / brand/mark/heirloom-mark-192.svg:
 * three bone warps, two interlacing wefts, the centre warp crossing OVER both
 * wefts, and a single ember knot at the held centre (96,96). Drawn directly
 * with canvas 2D so it stays crisp at every size — no generative art, no baked
 * rounded corners, no vignette.
 *
 *   ink   #0b0907   ground (edge to edge, square)
 *   bone  #f2e6d0   warps + wefts
 *   ember #e0a062 → #f0c074   the one emotional colour — the knot
 *
 * Output → cloudflare/frontend/public/icons. /favicon.svg + /icon.svg are
 * hand-authored copies of the shipped SVG marks.
 *
 * Run:  cd scripts && node generate-icons.cjs
 */
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'cloudflare', 'frontend', 'public', 'icons');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const INK = '#0b0907';
const BONE = '#f2e6d0';

// Master geometry lives in a 192-unit grid (the mark's viewBox). `scale` maps
// that grid into the tile: 1.0 fills it edge-to-edge, <1 pads for the maskable
// safe zone. Stroke is 9.6 in grid units.
const G = 192;
const WARPS = [64, 96, 128];          // x of the three warps
const WEFTS = [72, 120];              // y of the two wefts
const SPAN = [28, 164];               // warp top/bottom (and weft outer reach)
const GAP = 8;                        // half-gap each weft leaves around centre warp
const SW = 9.6;                       // stroke width in grid units

function draw(size, scale) {
  const cv = createCanvas(size, size);
  const ctx = cv.getContext('2d');

  // ground — pure ink, square, edge to edge
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, size, size);

  // grid → tile transform, centred
  const k = (size / G) * scale;
  const off = (size - G * k) / 2;
  const X = (u) => off + u * k;
  const Y = (v) => off + v * k;

  ctx.lineCap = 'round';
  ctx.strokeStyle = BONE;
  ctx.lineWidth = SW * k;

  const line = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(X(x1), Y(y1));
    ctx.lineTo(X(x2), Y(y2));
    ctx.stroke();
  };

  // 1 — outer warps pass UNDER the wefts: drawn first
  line(WARPS[0], SPAN[0], WARPS[0], SPAN[1]);
  line(WARPS[2], SPAN[0], WARPS[2], SPAN[1]);

  // 2 — wefts: two segments each, gapping across the centre warp (x=96)
  for (const y of WEFTS) {
    line(SPAN[0] + 16, y, WARPS[1] - GAP, y);   // 44 → 88
    line(WARPS[1] + GAP, y, SPAN[1] - 16, y);   // 104 → 148
  }

  // 3 — centre warp passes OVER both wefts: drawn last
  line(WARPS[1], SPAN[0], WARPS[1], SPAN[1]);

  // 4 — the ember knot at the held centre (96,96)
  const cx = X(96), cy = Y(96);
  const haloR = 40 * k;
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
  halo.addColorStop(0, 'rgba(224,160,98,0.40)');
  halo.addColorStop(0.6, 'rgba(224,160,98,0.18)');
  halo.addColorStop(1, 'rgba(224,160,98,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  const pipR = 12 * k;
  const pip = ctx.createRadialGradient(
    cx - pipR * 0.16, cy - pipR * 0.2, 0, cx, cy, pipR,
  );
  pip.addColorStop(0, '#f0c074');
  pip.addColorStop(1, '#e0a062');
  ctx.fillStyle = pip;
  ctx.beginPath();
  ctx.arc(cx, cy, pipR, 0, Math.PI * 2);
  ctx.fill();

  return cv.toBuffer('image/png');
}

// scale: 1.0 = full bleed (mark's own 28u grid margin is enough); maskable pads
// the mark into the centre safe circle (~0.62 of the 192 grid → ~0.8 safe zone).
const jobs = [
  ['icon-512.png', 512, 1.0],
  ['icon-192.png', 192, 1.0],
  ['apple-touch-icon.png', 180, 1.0],
  ['icon-maskable-512.png', 512, 0.78],
  ['icon-maskable-192.png', 192, 0.78],
];

for (const [name, size, scale] of jobs) {
  fs.writeFileSync(path.join(OUT, name), draw(size, scale));
  console.log('wrote', name, size + 'px');
}
console.log('done →', OUT);
