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
): { dyeHex: string } {
  // Ink ground.
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  const dye = DYES[Math.floor(rnd() * DYES.length)];

  // Dye tint seeding the water — a soft radial wash off-centre. The centre
  // drifts per seed so two same-dye posts still feel distinct.
  const tCx = w * (0.3 + rnd() * 0.4);
  const tCy = h * (0.25 + rnd() * 0.5);
  const tR = Math.max(w, h) * (0.55 + rnd() * 0.35);
  const tint = ctx.createRadialGradient(tCx, tCy, 0, tCx, tCy, tR);
  tint.addColorStop(0, withAlpha(dye.hex, 0.10 + rnd() * 0.05));
  tint.addColorStop(0.5, withAlpha(dye.hex, 0.04));
  tint.addColorStop(1, withAlpha(dye.hex, 0));
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);

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
}

// Render one Deep-water image and return PNG bytes. `renderWeave` is the
// original export name (run.ts imports it); `renderDeep` is the honest alias.
export function renderDeep({ saying, width, height, seed }: RenderOpts): Buffer {
  const { serif, mono } = ensureFonts();
  const rnd = mulberry32(hashSeed(seed));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  drawWater(ctx, width, height, rnd);
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

  ctx.font = `400 ${fontSize}px "${serif}"`;
  ctx.fillStyle = BONE;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, width / 2, firstBaseline + i * lineHeight);
  });

  // Eyebrow ∞ mark in warm copper, above the saying.
  ctx.font = `400 ${Math.round(fontSize * 0.66)}px "${serif}"`;
  ctx.fillStyle = WARM;
  ctx.fillText("∞", width / 2, firstBaseline - lineHeight * 1.1);

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