/**
 * Heirloom — Cosmic Loom icon generator
 *
 * Draws the brand mark directly with canvas 2D so it stays crisp at every
 * size and uses exact ART_DIRECTION tokens — no rasterised generative art,
 * no baked rounded corners, no vignette.
 *
 * The mark: a small web of bone-white filament hairlines converging on a
 * single softly glowing warm-amber node — the Cosmic Loom, in one glyph.
 *
 *   ink   #0e0e0c   ground (edge to edge, square)
 *   bone  #f4ecd8   filaments (low opacity hairlines)
 *   warm  #cf935a   the one emotional colour — the convergence node
 *
 * Output → cloudflare/frontend/public/icons + /icon.svg is hand-authored.
 *
 * Run:  cd scripts && node generate-icons.cjs
 */
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'cloudflare', 'frontend', 'public', 'icons');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const INK = '#0e0e0c';
const BONE = '244,236,216';
const WARM = '#cf935a';

// Fixed filament geometry — angle (turns), how far past center it reaches
// (outer), how far the near end sits from center (inner), and opacity.
// Hand-tuned to read as a centered, slightly irregular loom-web like the
// generative study, but balanced and symmetric enough for an app tile.
const THREADS = [
  { a: 0.02,  out: 1.00, inn: 0.96, op: 0.30 },
  { a: 0.08,  out: 0.92, inn: 1.00, op: 0.42 },
  { a: 0.155, out: 1.00, inn: 0.88, op: 0.26 },
  { a: 0.225, out: 0.86, inn: 1.00, op: 0.50 },
  { a: 0.30,  out: 1.00, inn: 0.94, op: 0.34 },
  { a: 0.375, out: 0.90, inn: 1.00, op: 0.28 },
  { a: 0.45,  out: 1.00, inn: 0.90, op: 0.46 },
  { a: 0.52,  out: 0.84, inn: 1.00, op: 0.30 },
  { a: 0.60,  out: 1.00, inn: 0.95, op: 0.40 },
  { a: 0.675, out: 0.92, inn: 1.00, op: 0.24 },
  { a: 0.75,  out: 1.00, inn: 0.88, op: 0.48 },
  { a: 0.82,  out: 0.88, inn: 1.00, op: 0.30 },
  { a: 0.90,  out: 1.00, inn: 0.93, op: 0.38 },
  { a: 0.96,  out: 0.94, inn: 1.00, op: 0.26 },
];

function draw(size, reach) {
  // reach = mark radius as a fraction of half-size (0.42 full / 0.30 safe)
  const cv = createCanvas(size, size);
  const ctx = cv.getContext('2d');

  // ground — pure ink, square, edge to edge
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const R = (size / 2) * reach;

  ctx.lineCap = 'round';
  const lw = Math.max(1, size / 460);

  // filaments — straight chords through (or near) the node, gentle curve
  for (const t of THREADS) {
    const ang = t.a * Math.PI * 2;
    const ux = Math.cos(ang), uy = Math.sin(ang);
    // two ends, asymmetric: far end (out) and opposite near end (inn)
    const x1 = cx + ux * R * t.out;
    const y1 = cy + uy * R * t.out;
    const x2 = cx - ux * R * t.inn;
    const y2 = cy - uy * R * t.inn;
    // slight perpendicular bow for an organic, woven feel
    const px = -uy, py = ux;
    const bow = R * 0.06 * (t.op > 0.4 ? 1 : -1);
    const mx = (x1 + x2) / 2 + px * bow;
    const my = (y1 + y2) / 2 + py * bow;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.strokeStyle = `rgba(${BONE},${t.op})`;
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  // the warm node — soft glow halo then a solid core
  const glowR = R * 0.34;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
  g.addColorStop(0, 'rgba(207,147,90,0.55)');
  g.addColorStop(0.4, 'rgba(176,122,74,0.28)');
  g.addColorStop(1, 'rgba(176,122,74,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
  ctx.fill();

  const coreR = Math.max(1.5, size * 0.022);
  ctx.fillStyle = WARM;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
  // bright pip
  ctx.fillStyle = '#e7b884';
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 0.45, 0, Math.PI * 2);
  ctx.fill();

  return cv.toBuffer('image/png');
}

const jobs = [
  ['icon-512.png', 512, 0.42],
  ['icon-192.png', 192, 0.42],
  ['apple-touch-icon.png', 180, 0.42],
  ['icon-maskable-512.png', 512, 0.30],
  ['icon-maskable-192.png', 192, 0.30],
];

for (const [name, size, reach] of jobs) {
  fs.writeFileSync(path.join(OUT, name), draw(size, reach));
  console.log('wrote', name, size + 'px');
}
console.log('done →', OUT);
