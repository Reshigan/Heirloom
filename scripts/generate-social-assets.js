/**
 * Heirloom Social Brand Asset Generator
 * Generates profile pictures, banners, and OG cards for all 7 platforms.
 *
 * Prerequisites:
 *   npm install canvas
 *
 * Usage:
 *   node scripts/generate-social-assets.js
 *
 * Output:
 *   scripts/assets/profile-pic-heirloom.png
 *   scripts/assets/banner-tiktok.png
 *   scripts/assets/banner-facebook.png
 *   scripts/assets/banner-twitter.png
 *   scripts/assets/banner-linkedin.png
 *   scripts/assets/banner-youtube.png
 *   scripts/assets/og-card.png
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'assets');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Brand colours
const VOID_BG = '#050608';
const VOID_GRADIENT_END = '#0a0c10';
const GOLD = '#c9a959';
const GOLD_GLOW = 'rgba(201,169,89,0.25)';
const CREAM = '#f5f3ee';

// Sizes per the spec
const SIZES = {
  profile:          { w: 1000, h: 1000 },
  'banner-tiktok':  { w: 1150, h: 180 },
  'banner-facebook': { w: 820,  h: 312 },
  'banner-twitter': { w: 1500, h: 500 },
  'banner-linkedin': { w: 1128, h: 191 },
  'banner-youtube': { w: 2560, h: 1440 },
  'og-card':        { w: 1200, h: 630 },
};

/**
 * Draw the infinity symbol at the given position and size.
 */
function drawInfinity(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  // Draw an infinity symbol using two circles
  const r = size * 0.3;
  const offset = r * 0.95;
  // Left loop
  ctx.arc(cx - offset, cy, r, 0, Math.PI * 2);
  // Right loop
  ctx.arc(cx + offset, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Scatter subtle gold dots.
 */
function drawParticles(ctx, w, h, count) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const radius = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,169,89,${Math.random() * 0.3 + 0.05})`;
    ctx.fill();
  }
}

/**
 * Draw dark gradient background.
 */
function drawBackground(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, VOID_BG);
  grad.addColorStop(0.4, VOID_GRADIENT_END);
  grad.addColorStop(1, '#0c0a0e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ---- Profile Picture ----
function generateProfile() {
  const { w, h } = SIZES.profile;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Dark circle background
  ctx.fillStyle = VOID_BG;
  ctx.fillRect(0, 0, w, h);

  // Circular mask
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
  ctx.fillStyle = VOID_BG;
  ctx.fill();

  // Gold glow behind infinity
  const glowGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.35);
  glowGrad.addColorStop(0, GOLD_GLOW);
  glowGrad.addColorStop(1, 'rgba(201,169,89,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);

  // Infinity symbol
  drawInfinity(ctx, w / 2, h / 2, w * 0.6, GOLD);

  const outPath = path.join(OUTPUT_DIR, 'profile-pic-heirloom.png');
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log(`  Created: ${outPath}`);
}

// ---- Banner / Cover images ----
function generateBanner(name) {
  const { w, h } = SIZES[name];
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx, w, h);
  drawParticles(ctx, w, h, Math.floor(w * h / 5000));

  // Infinity symbol — left-center
  const infSize = Math.min(h * 0.6, w * 0.12);
  drawInfinity(ctx, w * 0.15, h / 2, infSize, GOLD);

  // "HEIRLOOM" text
  const fontSize = Math.max(14, Math.floor(h * 0.22));
  ctx.font = `400 ${fontSize}px "serif"`;
  ctx.fillStyle = GOLD;
  ctx.letterSpacing = '0.3em';
  ctx.textBaseline = 'middle';
  ctx.fillText('H E I R L O O M', w * 0.28, h * 0.42);

  // Tagline
  const tagSize = Math.max(10, Math.floor(fontSize * 0.5));
  ctx.font = `300 ${tagSize}px "serif"`;
  ctx.fillStyle = CREAM;
  ctx.fillText('Your memories, forever.', w * 0.28, h * 0.65);

  // URL — right side
  const urlSize = Math.max(9, Math.floor(tagSize * 0.8));
  ctx.font = `300 ${urlSize}px "serif"`;
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'right';
  ctx.fillText('heirloom.blue', w - 30, h / 2);
  ctx.textAlign = 'left';

  const outPath = path.join(OUTPUT_DIR, `${name}.png`);
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log(`  Created: ${outPath}`);
}

// ---- OG Card ----
function generateOGCard() {
  const { w, h } = SIZES['og-card'];
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx, w, h);
  drawParticles(ctx, w, h, 80);

  // Gold glow center
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.35);
  glow.addColorStop(0, 'rgba(201,169,89,0.12)');
  glow.addColorStop(1, 'rgba(201,169,89,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Infinity
  drawInfinity(ctx, w / 2, h * 0.35, 200, GOLD);

  // Title
  ctx.font = '400 52px "serif"';
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.fillText('H E I R L O O M', w / 2, h * 0.6);

  // Tagline
  ctx.font = '300 28px "serif"';
  ctx.fillStyle = CREAM;
  ctx.fillText('Your memories, forever.', w / 2, h * 0.72);

  // URL
  ctx.font = '300 20px "serif"';
  ctx.fillStyle = CREAM;
  ctx.fillText('heirloom.blue', w / 2, h * 0.85);

  const outPath = path.join(OUTPUT_DIR, 'og-card.png');
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log(`  Created: ${outPath}`);
}

// ---- Main ----
console.log('Generating Heirloom social brand assets...\n');
generateProfile();
generateBanner('banner-tiktok');
generateBanner('banner-facebook');
generateBanner('banner-twitter');
generateBanner('banner-linkedin');
generateBanner('banner-youtube');
generateOGCard();
console.log('\nDone! All assets saved to scripts/assets/');
