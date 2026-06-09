// image.ts — render a distinct woven-cloth image per post, with the post's
// saying woven across the lower field, then upload it to R2 (via the worker) so
// the social platforms can fetch it by URL.
//
// Why this exists: the engine already generates a unique `saying` per post, but
// every post used to fall back to one static og-image.png. Seeing the same
// picture every day reads as a dead account. Each post now gets its own cloth —
// the weave pitch, thread jitter, and light angle are derived deterministically
// from the post's seed, so the same post always renders identically (cache-safe)
// while different posts look distinct.
//
// Palette + type follow ART_DIRECTION.md exactly: ink base, bone threads, the one
// warm accent at <3% surface, Source Serif 4 for the saying, JetBrains Mono for
// the archival wordmark. No gradients-as-decoration, no glass, the ∞ as the only
// mark. The cloth IS the Heirloom identity.

import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import path from "node:path";
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
      // weave still renders; only the typeface differs.
    }
    fontsReady = true;
  }
  return {
    serif: GlobalFonts.has("Heirloom Serif") ? "Heirloom Serif" : "serif",
    mono: GlobalFonts.has("Heirloom Mono") ? "Heirloom Mono" : "monospace",
  };
}

// Canonical tokens (ART_DIRECTION.md).
const INK = "#0e0e0c";
const BONE = "#f4ecd8";
const WARM = "#b07a4a";

// Deterministic seeded RNG so a given seed string always yields the same cloth.
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

// Draw the woven field: warp (vertical) + weft (horizontal) threads with an
// over-under interlace illusion, jittered per seed.
function drawWeave(
  ctx: SKRSContext2D,
  w: number,
  h: number,
  rnd: () => number,
): void {
  // Pitch (thread spacing) varies the weave tightness between posts.
  const pitch = Math.round(Math.min(w, h) / (44 + Math.floor(rnd() * 36))); // ~tight..loose
  const threadW = pitch * 0.62;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  const cols = Math.ceil(w / pitch) + 1;
  const rows = Math.ceil(h / pitch) + 1;

  // Warp — vertical threads.
  for (let c = 0; c < cols; c++) {
    const x = c * pitch + (rnd() - 0.5) * pitch * 0.12;
    const tone = 0.06 + rnd() * 0.05; // base bone alpha, jittered
    ctx.fillStyle = withAlpha(BONE, tone);
    ctx.fillRect(x - threadW / 2, 0, threadW, h);
  }

  // Weft — horizontal threads, drawn as the over-strands of the interlace: at
  // each cell we either let the weft show (over) or the warp show (under), in a
  // checker so the cloth reads as woven rather than as a grid.
  for (let r = 0; r < rows; r++) {
    const y = r * pitch + (rnd() - 0.5) * pitch * 0.12;
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) continue; // under — let warp show through
      const x = c * pitch;
      const tone = 0.07 + rnd() * 0.06;
      ctx.fillStyle = withAlpha(BONE, tone);
      ctx.fillRect(x - threadW / 2, y - threadW / 2, pitch, threadW);
    }
  }

  // A single warm weft thread — the one bloodline-dye signal, kept well under
  // 3% of surface. Placed in the upper field, away from the text.
  const warmY = h * (0.18 + rnd() * 0.16);
  ctx.fillStyle = withAlpha(WARM, 0.5);
  ctx.fillRect(0, warmY - threadW / 2, w, threadW * 0.8);
}

// Directional raking light: one soft highlight from a seed-chosen corner, fading
// to shadow — the light angle is what makes two same-pitch cloths feel distinct.
function drawLight(ctx: SKRSContext2D, w: number, h: number, rnd: () => number): void {
  const corner = Math.floor(rnd() * 4);
  const [cx, cy] = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ][corner];
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.9);
  grad.addColorStop(0, withAlpha(BONE, 0.07));
  grad.addColorStop(0.45, withAlpha(BONE, 0.0));
  grad.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// Film grain — scattered low-alpha specks, breaks up the digital flatness.
function drawGrain(ctx: SKRSContext2D, w: number, h: number, rnd: () => number): void {
  const count = Math.floor((w * h) / 1400);
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const a = rnd() * 0.05;
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
}

// Render one cloth image and return PNG bytes.
export function renderWeave({ saying, width, height, seed }: RenderOpts): Buffer {
  const { serif, mono } = ensureFonts();
  const rnd = mulberry32(hashSeed(seed));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  drawWeave(ctx, width, height, rnd);
  drawLight(ctx, width, height, rnd);
  drawGrain(ctx, width, height, rnd);

  // Darken the lower field so the saying is legible over the weave.
  const shade = ctx.createLinearGradient(0, height * 0.42, 0, height);
  shade.addColorStop(0, "rgba(14,14,12,0)");
  shade.addColorStop(0.55, "rgba(14,14,12,0.72)");
  shade.addColorStop(1, "rgba(14,14,12,0.94)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, height * 0.42, width, height * 0.58);

  const margin = width * 0.1;
  const maxTextWidth = width - margin * 2;

  // The saying — Source Serif, sized to the canvas, wrapped, set in the lower
  // third with generous leading.
  let fontSize = Math.round(Math.min(width, height) * 0.062);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  let lines: string[] = [];
  // Shrink until it fits in at most 4 lines.
  for (let attempt = 0; attempt < 6; attempt++) {
    ctx.font = `400 ${fontSize}px "${serif}"`;
    lines = wrapText(ctx, saying, maxTextWidth);
    if (lines.length <= 4) break;
    fontSize = Math.round(fontSize * 0.88);
  }
  const lineHeight = fontSize * 1.32;
  const blockHeight = lines.length * lineHeight;
  // Anchor the block so it sits in the lower third, above the wordmark.
  const baselineStart = height * 0.82 - blockHeight + lineHeight * 0.78;

  ctx.font = `400 ${fontSize}px "${serif}"`;
  ctx.fillStyle = BONE;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, width / 2, baselineStart + i * lineHeight);
  });

  // Eyebrow ∞ mark in warm, above the saying.
  ctx.font = `400 ${Math.round(fontSize * 0.9)}px "${serif}"`;
  ctx.fillStyle = WARM;
  ctx.fillText("∞", width / 2, baselineStart - blockHeight + lineHeight * 0.1 - fontSize * 0.4);

  // Archival wordmark, JetBrains Mono, bottom-centered, letter-spaced.
  const markSize = Math.round(Math.min(width, height) * 0.022);
  ctx.font = `400 ${markSize}px "${mono}"`;
  ctx.fillStyle = withAlpha(BONE, 0.55);
  const wordmark = "H E I R L O O M . B L U E";
  ctx.fillText(wordmark, width / 2, height - margin * 0.55);

  return canvas.toBuffer("image/png");
}

// Upload PNG bytes to the worker, which stores them in R2 and returns a public
// URL. Returns null when the engine is dormant (no admin token / API url) so the
// caller can fall back to the static image.
export async function uploadWeave(png: Buffer, filename: string): Promise<string | null> {
  const apiUrl = process.env.HEIRLOOM_API_URL || "https://api.heirloom.blue";
  const token = process.env.HEIRLOOM_ADMIN_TOKEN;
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
