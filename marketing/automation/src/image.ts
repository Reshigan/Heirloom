// image.ts — render a distinct Deep-water image per post, with the post's
// saying set as the hero, then upload it to R2 (via the worker) so the social
// platforms can fetch it by URL.
//
// Why this exists: the engine already generates a unique `saying` per post, but
// every post used to fall back to one static og-image.png. Seeing the same
// picture every day reads as a dead account. Each post now gets its own image —
// the dye tint, depth-ring spacing, and light angle are derived deterministically
// from the post's seed, so the same post always renders identically (cache-safe)
// while different posts look distinct.
//
// The image IS The Deep (brand/BRAND.md §6 + ART_DIRECTION.md): a close-up of
// deep still water — ink-dark ground #070d14, the family's natural-dye colour
// subtly seeding the water (a faint tint, never a flat fill), slow concentric
// depth-rings (the Sounding mark) faintly visible, one thin warm (copper)
// surface-line, soft directional light from one side, film grain. The saying is
// set large and centered in Source Serif 4; the ∞ mark sits above in copper; the
// archival wordmark sits below in JetBrains Mono. No photography of people,
// hands, letters, or objects — only the water surface itself.
//
// Palette + type follow ART_DIRECTION.md + brand/BRAND.md: ink/bone grounds, the
// one warm accent at <3% surface, Source Serif 4 for the saying, JetBrains Mono
// for the archival wordmark. No gradients-as-decoration, no glass, the ∞ as the
// only mark. The `renderWeave` export name is kept for back-compat with run.ts
// (code names keep the loom lineage); `renderDeep` is the honest alias.

import { createCanvas, GlobalFonts, Path2D, type Canvas, type SKRSContext2D } from "@napi-rs/canvas";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Fonts live in the sibling scripts/ asset tree (single source of truth).
const FONT_DIR = path.resolve(__dirname, "../../../scripts/fonts");

let fontsReady = false;
function ensureFonts(): { serif: string; mono: string } {
  if (!fontsReady) {
    try {
      GlobalFonts.registerFromPath(path.join(FONT_DIR, "SourceSerif4.ttf"), "Heirloom Serif");
      GlobalFonts.registerFromPath(path.join(FONT_DIR, "JetBrainsMono.ttf"), "Heirloom Mono");
    } catch {
      // If the bundled fonts are missing, fall back to system families. The
      // water still renders; only the typeface differs.
    }
    fontsReady = true;
  }
  return {
    serif: GlobalFonts.has("Heirloom Serif") ? "Heirloom Serif" : "serif",
    mono: GlobalFonts.has("Heirloom Mono") ? "Heirloom Mono" : "monospace",
  };
}

// Canonical tokens (ART_DIRECTION.md + src/styles/globals.css).
const INK = "#070d14"; // the Deep's deep water
const BONE = "#f2e6d0"; // cream
const WARM = "#e0a062"; // copper (the single warm accent)

// The 10-stop natural-dye palette (dark-theme tokens, src/styles/globals.css).
// Each post's water is seeded by one dye — a faint tint, never a fill. The dye
// is chosen deterministically from the seed so a given post always carries the
// same family colour.
const DYES: { name: string; hex: string }[] = [
  { name: "madder", hex: "#d94f38" },
  { name: "cochineal", hex: "#8a5578" },
  { name: "kermes", hex: "#c46a7a" },
  { name: "saffron", hex: "#d4a32f" },
  { name: "weld", hex: "#c9941f" },
  { name: "walnut", hex: "#7d5635" },
  { name: "oakgall", hex: "#6d8a56" },
  { name: "woad", hex: "#4f8a8a" },
  { name: "indigo", hex: "#46679c" },
  { name: "iron", hex: "#56707a" },
];

// Deterministic seeded RNG so a given seed string always yields the same water.
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// The deep-water ground: ink fill, then the family dye seeding the water as a
// soft off-centre radial tint (very low alpha — a hint of colour, not a fill),
// then the Sounding mark — slow concentric depth-rings faintly visible — and
// one thin warm surface-line near the top (the warm line of the Sounding mark,
// kept well under 3% of surface and pinned clear of the centered saying).
function drawWater(
  ctx: SKRSContext2D,
  w: number,
  h: number,
  rnd: () => number,
  dyeName?: string,
): { dyeHex: string } {
  // Ink ground.
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  // Always consume one rnd() so the rest of the water is identical whether or
  // not a pack forces its signature dye.
  const pick = Math.floor(rnd() * DYES.length);
  const dye = (dyeName ? DYES.find((d) => d.name === dyeName) : undefined) ?? DYES[pick];

  // Dye tint seeding the water — a soft radial wash off-centre. The centre
  // drifts per seed so two same-dye posts still feel distinct. Pack mode (a
  // forced signature dye) pushes the wash bold so each need-state reads as its
  // own colour at a glance; legacy daily posts (random dye) stay a faint hint.
  const bold = !!dyeName;
  const tCx = w * (0.3 + rnd() * 0.4);
  const tCy = h * (0.25 + rnd() * 0.5);
  const tR = Math.max(w, h) * (0.55 + rnd() * 0.35);
  const aJit = rnd() * 0.05;
  const tint = ctx.createRadialGradient(tCx, tCy, 0, tCx, tCy, tR);
  tint.addColorStop(0, withAlpha(dye.hex, bold ? 0.34 : 0.10 + aJit));
  tint.addColorStop(0.5, withAlpha(dye.hex, bold ? 0.16 : 0.04));
  tint.addColorStop(1, withAlpha(dye.hex, bold ? 0.03 : 0));
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);

  // Pack mode: a second deep wash anchored to a bottom corner so the colour
  // wraps the frame and survives the centre vignette behind the type.
  if (bold) {
    const bx = rnd() > 0.5 ? w : 0;
    const wash = ctx.createRadialGradient(bx, h, 0, bx, h, Math.hypot(w, h) * 0.85);
    wash.addColorStop(0, withAlpha(dye.hex, 0.22));
    wash.addColorStop(0.55, withAlpha(dye.hex, 0.07));
    wash.addColorStop(1, withAlpha(dye.hex, 0));
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  }

  // Sounding mark — concentric depth-rings. Centre drifts per seed; rings fade
  // outward so they read as depth, not as a target. Bone hairline, 1px.
  const rCx = w * (0.35 + rnd() * 0.3);
  const rCy = h * (0.4 + rnd() * 0.25);
  const ringCount = 5 + Math.floor(rnd() * 4); // 5–8 rings
  const ringStep = Math.max(w, h) * (0.07 + rnd() * 0.04);
  ctx.lineWidth = 1;
  for (let i = 1; i <= ringCount; i++) {
    const radius = ringStep * i;
    const a = 0.11 * (1 - i / (ringCount + 1)) + 0.02; // fade outward
    ctx.strokeStyle = withAlpha(BONE, a);
    ctx.beginPath();
    ctx.arc(rCx, rCy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // One warm surface-line — the Sounding mark's warm line, thin, near the top,
  // full width. Pinned high so it stays clear of the centered saying. This is
  // the only warm fill on the card (signal only, <3% surface).
  const surfY = h * (0.07 + rnd() * 0.04);
  ctx.fillStyle = withAlpha(WARM, 0.4);
  ctx.fillRect(0, surfY, w, Math.max(1, Math.round(h * 0.0015)));

  return { dyeHex: dye.hex };
}

// Directional raking light: one soft highlight from a seed-chosen side, fading
// to deep shadow at the far edges — the light angle is what makes two same-dye
// waters feel distinct, and the fall-off reads as depth.
function drawLight(ctx: SKRSContext2D, w: number, h: number, rnd: () => number): void {
  const corner = Math.floor(rnd() * 4);
  const [cx, cy] = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ][corner];
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.95);
  grad.addColorStop(0, withAlpha(BONE, 0.06));
  grad.addColorStop(0.4, withAlpha(BONE, 0));
  grad.addColorStop(1, "rgba(0,0,0,0.55)"); // deep water shadow
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// Film grain — scattered low-alpha specks, breaks up the digital flatness.
function drawGrain(ctx: SKRSContext2D, w: number, h: number, rnd: () => number): void {
  const count = Math.floor((w * h) / 1400);
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const a = rnd() * 0.045;
    ctx.fillStyle = rnd() > 0.5 ? withAlpha(BONE, a) : `rgba(0,0,0,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

// Word-wrap to a max width, returning lines.
function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface RenderOpts {
  saying: string;
  width: number;
  height: number;
  seed: string;
  // Pack identity (optional, fully back-compat — omit for the original behaviour):
  dye?: string;      // force the water's signature dye (a DYES name) per need-state
  eyebrow?: string;  // a quiet copper mono addressing line above the ∞ ("FOR A NEW MOTHER")
}

// Render one Deep-water image and return PNG bytes. `renderWeave` is the
// original export name (run.ts imports it); `renderDeep` is the honest alias.
export function renderDeep({ saying, width, height, seed, dye, eyebrow }: RenderOpts): Buffer {
  const { serif, mono } = ensureFonts();
  const rnd = mulberry32(hashSeed(seed));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  drawWater(ctx, width, height, rnd, dye);
  drawLight(ctx, width, height, rnd);
  drawGrain(ctx, width, height, rnd);

  // Soft vignette of the ground color behind the type block — keeps the saying
  // legible over the water without flattening the depth.
  const vg = ctx.createRadialGradient(
    width / 2, height * 0.5, Math.min(width, height) * 0.12,
    width / 2, height * 0.5, Math.max(width, height) * 0.72,
  );
  vg.addColorStop(0, withAlpha(INK, 0.55));
  vg.addColorStop(1, withAlpha(INK, 0));
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);

  const margin = width * 0.09;
  const maxTextWidth = width - margin * 2;

  // The saying IS the image — Source Serif, large, centered, bone on the deep
  // water. At thumbnail size the type either reads or the card is a blank
  // rectangle, so start big and shrink only until the block fits.
  let fontSize = Math.round(Math.min(width, height) * 0.095);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  let lines: string[] = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    ctx.font = `400 ${fontSize}px "${serif}"`;
    lines = wrapText(ctx, saying, maxTextWidth);
    if (lines.length <= 6 && lines.length * fontSize * 1.28 <= height * 0.62) break;
    fontSize = Math.round(fontSize * 0.9);
  }
  const lineHeight = fontSize * 1.28;
  const blockHeight = lines.length * lineHeight;
  const firstBaseline = height * 0.52 - blockHeight / 2 + lineHeight * 0.72;

  // First Light: the opening words carry full cream; the rest recede — the
  // same two-tone breath as the product's surface.
  ctx.font = `400 ${fontSize}px "${serif}"`;
  const allWords = saying.split(/\s+/);
  const headCount = Math.min(3, Math.max(1, Math.floor(allWords.length / 3)));
  let drawn = 0;
  lines.forEach((ln, i) => {
    const lineWords = ln.split(/\s+/);
    let x = width / 2 - ctx.measureText(ln).width / 2;
    const y = firstBaseline + i * lineHeight;
    ctx.textAlign = "left";
    for (const w of lineWords) {
      ctx.fillStyle = drawn < headCount ? BONE : withAlpha(BONE, 0.62);
      ctx.fillText(w, x, y);
      x += ctx.measureText(w + " ").width;
      drawn++;
    }
    ctx.textAlign = "center";
  });

  // The archive glowing beneath — dye-lights rising from the base (First Light).
  {
    const glows = 5;
    for (let i = 0; i < glows; i++) {
      const dyeHexG = DYES[(hashSeed(saying) + i * 7) % DYES.length].hex;
      const gx = width * (0.12 + ((hashSeed(saying + i) % 68) / 100));
      const gy = height - height * (0.04 + ((hashSeed(String(i) + saying) % 14) / 100));
      const r = Math.min(width, height) * (0.006 + (i % 3) * 0.002);
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * 5);
      glow.addColorStop(0, withAlpha(dyeHexG, 0.85));
      glow.addColorStop(0.35, withAlpha(dyeHexG, 0.28));
      glow.addColorStop(1, withAlpha(dyeHexG, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(gx, gy, r * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Eyebrow: the Drop mark in warm copper, above the saying — the same brushed
  // geometry as brand/mark/heirloom-drop-*.svg, scaled to the type.
  {
    const mh = fontSize * 0.9; // mark box height
    const sc = mh / 48;
    const mx = width / 2 - 24 * sc;
    const my = firstBaseline - lineHeight * 1.35 - 24 * sc;
    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(sc, sc);
    const P = (d: string, fill: string) => { ctx.fillStyle = fill; ctx.fill(new Path2D(d)); };
    P("M4 13.9 C 15 11.9, 29 15.3, 44 13 C 30 16.3, 15 14, 4 15 Z", WARM);
    P("M23.6 24.9 C 26.8 24.8, 28.7 27.2, 28.2 30 C 27.8 32.6, 25.2 34.1, 22.8 33.4 C 20.5 32.7, 19.5 30.3, 20.3 27.9 C 21 26, 22.2 25.1, 23.6 24.9 Z", WARM);
    P("M10 31.4 C 14.5 41.2, 33.5 41.9, 38.4 30.7 C 33.5 40.2, 14.5 40.2, 10 31.4 Z", withAlpha(BONE, 0.55));
    ctx.restore();
  }

  // Need-state addressing line — a quiet copper mono label above the ∞ ("FOR A
  // NEW MOTHER"). Lets the reader feel seen the instant the post loads; copper
  // because it is the signal that says "this one is for you". Letter-spaced via
  // thin spaces (canvas has no reliable tracking).
  if (eyebrow) {
    const ebSize = Math.round(Math.min(width, height) * 0.021);
    ctx.font = `500 ${ebSize}px "${mono}"`;
    ctx.fillStyle = withAlpha(WARM, 0.9);
    ctx.fillText(
      eyebrow.toUpperCase().split("").join(" "),
      width / 2,
      firstBaseline - lineHeight * 2.0,
    );
  }

  // Archival wordmark, JetBrains Mono, bottom-centered, letter-spaced.
  const markSize = Math.round(Math.min(width, height) * 0.024);
  ctx.font = `400 ${markSize}px "${mono}"`;
  ctx.fillStyle = withAlpha(BONE, 0.72);
  const wordmark = "H E I R L O O M . B L U E";
  ctx.fillText(wordmark, width / 2, height - margin * 0.55);

  return canvas.toBuffer("image/png");
}

// Back-compat alias — run.ts imports renderWeave.
export const renderWeave = renderDeep;

// ── Animated packs ─────────────────────────────────────────────────────────
// A short, looping, on-brand motion video per pack: the water breathes, the
// Sounding rings ping outward, and the message settles in (eyebrow → ∞ → saying)
// on the brand easing. Rendered frame-by-frame and encoded to H.264 MP4 via
// ffmpeg (both Facebook and Bluesky accept video; MP4 keeps the water gradients
// smooth where GIF would band). This is the same motion approved in the preview.

const dyeHex = (name?: string): string =>
  (name ? DYES.find((d) => d.name === name)?.hex : undefined) ?? DYES[0].hex;
const ease01 = (x: number): number => {
  x = Math.max(0, Math.min(1, x));
  return 1 - Math.pow(1 - x, 3);
};

// Seeded, frame-stable layout — fixed for the whole clip so only time animates.
interface FrameLayout {
  lightCorner: [number, number];
  surfY: number;
  grain: Canvas;
}
function frameLayout(w: number, h: number, seed: string): FrameLayout {
  const rnd = mulberry32(hashSeed(seed));
  const corner = Math.floor(rnd() * 4);
  const lightCorner = ([[0, 0], [w, 0], [0, h], [w, h]] as [number, number][])[corner];
  const surfY = h * (0.07 + rnd() * 0.04);
  const grain: Canvas = createCanvas(w, h);
  const gctx = grain.getContext("2d");
  const count = Math.floor((w * h) / 1500);
  for (let i = 0; i < count; i++) {
    const a = rnd() * 0.045;
    gctx.fillStyle = rnd() > 0.5 ? withAlpha(BONE, a) : `rgba(0,0,0,${a})`;
    gctx.fillRect(rnd() * w, rnd() * h, 1, 1);
  }
  return { lightCorner, surfY, grain };
}

interface FramePack { saying: string; dye?: string; eyebrow?: string }

function paintFrame(
  ctx: SKRSContext2D, W: number, H: number, p: FramePack,
  serif: string, mono: string, L: FrameLayout, tMs: number, durMs: number,
): void {
  const dye = dyeHex(p.dye);
  const breath = 0.5 + 0.5 * Math.sin((2 * Math.PI * tMs) / durMs);

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  // main dye wash, off-centre, gently drifting (bold pack tint)
  const cx = W * 0.42, cy = H * 0.42 + Math.sin((2 * Math.PI * tMs) / durMs) * H * 0.02;
  let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.95);
  g.addColorStop(0, withAlpha(dye, 0.30 + breath * 0.06));
  g.addColorStop(0.5, withAlpha(dye, 0.15));
  g.addColorStop(1, withAlpha(dye, 0.03));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(W, H, 0, W, H, Math.hypot(W, H) * 0.85);
  g2.addColorStop(0, withAlpha(dye, 0.22));
  g2.addColorStop(0.55, withAlpha(dye, 0.07));
  g2.addColorStop(1, withAlpha(dye, 0));
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);
  // Sounding rings — one full emanation per clip, so the loop is seamless.
  const rCx = W * 0.5, rCy = H * 0.46, maxR = Math.max(W, H) * 0.62, N = 6;
  ctx.lineWidth = 1;
  for (let i = 0; i < N; i++) {
    const ph = ((tMs / durMs) + i / N) % 1;
    ctx.strokeStyle = withAlpha(BONE, (1 - ph) * 0.10);
    ctx.beginPath();
    ctx.arc(rCx, rCy, ph * maxR, 0, Math.PI * 2);
    ctx.stroke();
  }
  // raking light
  const [lx, ly] = L.lightCorner;
  const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.hypot(W, H) * 0.95);
  lg.addColorStop(0, withAlpha(BONE, 0.06));
  lg.addColorStop(0.4, withAlpha(BONE, 0));
  lg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(L.grain, 0, 0);
  // warm surface-line
  ctx.fillStyle = withAlpha(WARM, 0.4);
  ctx.fillRect(0, L.surfY, W, Math.max(1, Math.round(H * 0.0015)));
  // centre vignette behind type
  const vg = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.12, W / 2, H * 0.5, Math.max(W, H) * 0.72);
  vg.addColorStop(0, withAlpha(INK, 0.55));
  vg.addColorStop(1, withAlpha(INK, 0));
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // type with the settle-in reveal
  const fontSize = Math.round(Math.min(W, H) * 0.082);
  const font = `400 ${fontSize}px "${serif}"`;
  ctx.font = font;
  const lines = wrapText(ctx, p.saying, W * 0.82);
  const lh = fontSize * 1.28, block = lines.length * lh, firstBase = H * 0.53 - block / 2 + lh * 0.72;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  if (p.eyebrow) {
    const a = ease01((tMs - 100) / 700);
    ctx.font = `500 ${Math.round(Math.min(W, H) * 0.021)}px "${mono}"`;
    ctx.fillStyle = withAlpha(WARM, 0.9 * a);
    ctx.fillText(p.eyebrow.toUpperCase().split("").join(" "), W / 2, firstBase - lh * 2.0 - (1 - a) * 12);
  }
  const infA = ease01((tMs - 350) / 700);
  ctx.save();
  ctx.font = `400 ${Math.round(fontSize * 0.66)}px "${serif}"`;
  ctx.fillStyle = withAlpha(WARM, infA);
  ctx.shadowColor = withAlpha(WARM, 0.6 * infA);
  ctx.shadowBlur = 8 + Math.sin((2 * Math.PI * tMs) / durMs) * 6;
  ctx.fillText("∞", W / 2, firstBase - lh * 1.05);
  ctx.restore();
  ctx.font = font;
  lines.forEach((ln, i) => {
    const a = ease01((tMs - 700 - i * 170) / 750);
    if (a <= 0.001) return;
    ctx.fillStyle = withAlpha(BONE, a);
    ctx.fillText(ln, W / 2, firstBase + i * lh + (1 - a) * 14);
  });
  ctx.font = `400 ${Math.round(Math.min(W, H) * 0.024)}px "${mono}"`;
  ctx.fillStyle = withAlpha(BONE, 0.72);
  ctx.fillText("H E I R L O O M . B L U E", W / 2, H - Math.min(W, H) * 0.09 * 0.55);
}

export interface RenderVideoOpts extends RenderOpts {
  seconds?: number;
  fps?: number;
}

// Render the animated pack and return MP4 (H.264) bytes. Requires ffmpeg on PATH.
export async function renderDeepVideo(opts: RenderVideoOpts): Promise<Buffer> {
  const { saying, width, height, seed, dye, eyebrow, fps = 30, seconds = 6 } = opts;
  const { serif, mono } = ensureFonts();
  const layout = frameLayout(width, height, seed);
  const durMs = seconds * 1000;
  const total = Math.round(fps * seconds);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const tmp = path.join(os.tmpdir(), `deep-${process.pid}-${seed.replace(/\W/g, "")}.mp4`);

  const ff = spawn("ffmpeg", [
    "-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-r", String(fps), tmp,
  ], { stdio: ["pipe", "ignore", "pipe"] });

  // ffmpeg missing/dying must reject this promise — never crash the process — so
  // the caller falls back to the static image. Swallow stdin EPIPE for the same
  // reason; capture the spawn error and surface it after the pipe drains.
  let spawnErr: Error | null = null;
  ff.on("error", (e) => { spawnErr = e; });
  ff.stdin.on("error", () => {});
  let stderr = "";
  ff.stderr.on("data", (d) => { stderr += d.toString(); });
  const closed = new Promise<number | null>((res) => ff.on("close", (code) => res(code)));

  // Let an ENOENT (ffmpeg not installed) surface before we stream frames.
  await new Promise((r) => setImmediate(r));
  if (spawnErr) { ff.stdin.end(); throw new Error(`ffmpeg unavailable: ${(spawnErr as Error).message}`); }

  try {
    for (let f = 0; f < total && !spawnErr; f++) {
      paintFrame(ctx, width, height, { saying, dye, eyebrow }, serif, mono, layout, (f / fps) * 1000, durMs);
      const png = canvas.toBuffer("image/png");
      if (!ff.stdin.write(png)) {
        await new Promise<void>((r) => { ff.stdin.once("drain", () => r()); ff.once("close", () => r()); });
      }
    }
  } finally {
    ff.stdin.end();
  }

  const code = await closed;
  if (spawnErr) throw new Error(`ffmpeg unavailable: ${(spawnErr as Error).message}`);
  if (code !== 0) throw new Error(`ffmpeg exited ${code}: ${stderr.slice(-400)}`);
  const buf = await readFile(tmp);
  await unlink(tmp).catch(() => {});
  return buf;
}

// Upload PNG bytes to the worker, which stores them in R2 and returns a public
// URL. Returns null when the engine is dormant (no upload token / API url) so
// the caller can fall back to the static image.
export async function uploadWeave(png: Buffer, filename: string): Promise<string | null> {
  const apiUrl = process.env.HEIRLOOM_API_URL || "https://api.heirloom.blue";
  // Dedicated upload secret — deliberately NOT HEIRLOOM_ADMIN_TOKEN. That var
  // also switches post() into the Postiz worker-queue path (post.ts), which
  // posts by imageUrl only and would drop the direct weave-bytes upload to
  // Facebook/Bluesky. Keep the two concerns on separate secrets.
  const token = process.env.SOCIAL_UPLOAD_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `${apiUrl}/api/admin/social/upload-image?filename=${encodeURIComponent(filename)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "image/png" },
        body: png as unknown as BodyInit,
      },
    );
    if (!res.ok) {
      console.error(`[image] upload failed ${res.status} — falling back to static image`);
      return null;
    }
    const json = (await res.json().catch(() => ({}))) as { url?: string };
    return json.url ?? null;
  } catch (err) {
    console.error("[image] upload error — falling back to static image", err);
    return null;
  }
}