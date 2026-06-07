/**
 * Heirloom TikTok / short-video generator — CLOTH-FAITHFUL (STITCH_BRIEF §2).
 *
 * Renders a 1080×1920 (9:16) vertical video with @napi-rs/canvas + ffmpeg.
 * No puppeteer, no system rasterizer — prebuilt canvas binary only.
 *
 * Design constitution honoured:
 *   - ink #0e0e0c ground, bone #f4ecd8 type, warm #b07a4a kept <3% (one weft).
 *   - Source Serif 4 (display + prose), JetBrains Mono (archival URL line).
 *   - the cloth IS the surface: faint bone warp threads + one warm weft that
 *     shuttles. No gradient mesh, no glow, no icons — ∞ is the only mark.
 *   - motion easing cubic-bezier(0.16,1,0.3,1); fades 360/720ms, shuttle 1400ms.
 *
 * Usage:
 *   node scripts/generate-tiktok.mjs                       # default: Father's Day
 *   node scripts/generate-tiktok.mjs --config <file.json>  # a bank entry
 *   node scripts/generate-tiktok.mjs --out <path.mp4>
 *
 * A "config" is { id, segments[], duration } — see fathersDay() below for the
 * shape. generateShort(config) is exported so the bank generator can call it.
 */
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS = path.join(__dirname, "fonts");
const OUT_DIR = path.join(__dirname, "..", "output", "videos");

GlobalFonts.registerFromPath(path.join(FONTS, "SourceSerif4.ttf"), "Source Serif 4");
GlobalFonts.registerFromPath(path.join(FONTS, "SourceSerif4-It.ttf"), "Source Serif 4 It");
GlobalFonts.registerFromPath(path.join(FONTS, "JetBrainsMono.ttf"), "JetBrains Mono");

const W = 1080;
const H = 1920;
const FPS = 30;

const INK = "#0e0e0c";
const BONE = "#f4ecd8";
const WARM = "#b07a4a";

// The brief's one motion curve, cubic-bezier(0.16,1,0.3,1), as an easing fn.
function cubicBezier(p1x, p1y, p2x, p2y) {
  // Newton-Raphson solve for x→t, then evaluate y. Good enough for 30fps.
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const fx = (t) => ((ax * t + bx) * t + cx) * t;
  const fy = (t) => ((ay * t + by) * t + cy) * t;
  const dfx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-4) break;
      const d = dfx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return fy(Math.max(0, Math.min(1, t)));
  };
}
const EASE = cubicBezier(0.16, 1, 0.3, 1);

// Fade a segment in over `dur` ms starting at `start` ms; returns {alpha, dy}.
function reveal(nowMs, startMs, durMs = 720) {
  if (nowMs < startMs) return { alpha: 0, dy: 28 };
  const p = Math.min(1, (nowMs - startMs) / durMs);
  const e = EASE(p);
  return { alpha: e, dy: 28 * (1 - e) };
}

// hex + alpha → rgba()
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Draw the cloth: faint bone warp threads + one warm weft that shuttles down.
function drawCloth(ctx, nowMs, totalMs) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  // Vertical warp threads — bone, very low opacity, evenly spaced. The cloth.
  const cols = 9;
  const gap = W / (cols + 1);
  ctx.lineWidth = 1;
  for (let i = 1; i <= cols; i++) {
    const x = Math.round(i * gap) + 0.5;
    ctx.strokeStyle = rgba(BONE, i % 3 === 0 ? 0.07 : 0.035);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // One warm weft thread, the single emotional colour, shuttling slowly down
  // the cloth over the whole clip (1400ms-feel, eased). <3% surface area.
  const p = EASE(Math.min(1, nowMs / Math.max(1, totalMs)));
  const y = Math.round(H * (0.16 + 0.66 * p)) + 0.5;
  ctx.strokeStyle = rgba(WARM, 0.9);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
  // over-under: redraw the warps crossing the weft so it reads woven
  for (let i = 1; i <= cols; i++) {
    if (i % 3 !== 0) continue;
    const x = Math.round(i * gap) + 0.5;
    ctx.strokeStyle = rgba(BONE, 0.07);
    ctx.beginPath();
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x, y + 7);
    ctx.stroke();
  }
}

// Word-wrap a string to a max width, return lines.
function wrap(ctx, text, maxW) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawSegment(ctx, seg, nowMs) {
  const { alpha, dy } = reveal(nowMs, seg.start, seg.fade ?? 720);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const font = seg.italic ? "Source Serif 4 It" : "Source Serif 4";
  ctx.font = `${seg.italic ? "italic " : ""}${seg.weight ?? 400} ${seg.size}px "${font}"`;
  ctx.fillStyle = seg.color ?? BONE;
  const maxW = W - 200;
  const lines = wrap(ctx, seg.text, maxW);
  const lh = seg.size * 1.22;
  const blockH = lines.length * lh;
  let y = seg.y - blockH / 2 + lh / 2 + dy;
  for (const ln of lines) {
    ctx.fillText(ln, W / 2, y);
    y += lh;
  }
  ctx.restore();
}

function drawEndCard(ctx, card, nowMs) {
  const { alpha, dy } = reveal(nowMs, card.start, 720);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // ∞ — the only mark, warm.
  ctx.fillStyle = WARM;
  ctx.font = `300 120px "Source Serif 4"`;
  ctx.fillText("∞", W / 2, H * 0.78 + dy);
  // URL — archival mono, bone faint, letterspaced via manual spacing.
  ctx.fillStyle = rgba(BONE, 0.62);
  ctx.font = `400 30px "JetBrains Mono"`;
  ctx.fillText("H E I R L O O M . B L U E", W / 2, H * 0.78 + 110 + dy);
  // CTA — Source Serif italic, on-voice.
  ctx.fillStyle = rgba(BONE, 0.85);
  ctx.font = `italic 400 40px "Source Serif 4 It"`;
  ctx.fillText(card.cta, W / 2, H * 0.78 + 175 + dy);
  ctx.restore();
}

export async function generateShort(config, opts = {}) {
  const outDir = opts.outDir || OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  const framesDir = fs.mkdtempSync(path.join("/tmp", `hl-${config.id}-`));
  const totalMs = config.duration * 1000;
  const totalFrames = config.duration * FPS;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  for (let f = 0; f < totalFrames; f++) {
    const nowMs = (f / FPS) * 1000;
    drawCloth(ctx, nowMs, totalMs);
    for (const seg of config.segments) drawSegment(ctx, seg, nowMs);
    if (config.endCard) drawEndCard(ctx, config.endCard, nowMs);
    fs.writeFileSync(
      path.join(framesDir, `f-${String(f).padStart(5, "0")}.png`),
      canvas.toBuffer("image/png"),
    );
  }

  const outPath = path.join(outDir, `${config.id}.mp4`);
  // 9:16 H.264, yuv420p so every player (TikTok/IG/Shorts) accepts it.
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-framerate", String(FPS),
      "-i", path.join(framesDir, "f-%05d.png"),
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-profile:v", "high",
      "-movflags", "+faststart",
      "-an",
      outPath,
    ],
    { stdio: "pipe" },
  );
  fs.rmSync(framesDir, { recursive: true, force: true });
  return outPath;
}

// ── Default content: Father's Day (in-season), taggable-question + time-lock ──
// On voice: door first (one question tonight), the specific ask, then the magic
// (time-lock for a grandchild not yet born). No banned words, no gradient, ∞ only.
export function fathersDay() {
  return {
    id: "fathersday-ask",
    duration: 13,
    segments: [
      { text: "Ask your dad one question tonight.", y: H * 0.30, size: 78, weight: 500, start: 300 },
      { text: "Not “how are you.”", y: H * 0.44, size: 52, start: 2600 },
      { text: "Ask what he was like at 25 — before he was your dad.", y: H * 0.52, size: 52, italic: true, start: 3600 },
      { text: "Record his answer.", y: H * 0.63, size: 56, start: 6800, color: BONE },
      { text: "Lock it for a grandchild who isn’t born yet.", y: H * 0.70, size: 50, italic: true, start: 7800, color: WARM },
    ],
    endCard: { start: 10200, cta: "Start your family’s thread." },
  };
}

// ── Authoring helper ─────────────────────────────────────────────────────────
// Turn a compact spec into a full timed config. A spec is:
//   { id, hook, beats: [{ text, italic?, warm? }], cta }
// The hook lands at 0.30H; beats stagger downward; the end card follows. This
// keeps the video bank (tiktok-bank.json) easy to write and on-voice.
export function fromSpec(spec) {
  const beats = spec.beats || [];
  const segments = [
    { text: spec.hook, y: H * 0.30, size: 78, weight: 500, start: 300 },
  ];
  // Lay beats between 0.45H and 0.72H, ~1000ms apart after the hook reads.
  const top = 0.45, bottom = 0.72;
  const step = beats.length > 1 ? (bottom - top) / (beats.length - 1) : 0;
  let start = 2600;
  beats.forEach((b, i) => {
    segments.push({
      text: b.text,
      y: H * (top + step * i),
      size: b.warm ? 50 : 52,
      italic: !!b.italic,
      color: b.warm ? WARM : BONE,
      start,
    });
    start += 1100;
  });
  return {
    id: spec.id,
    duration: Math.max(11, Math.ceil((start + 3500) / 1000)),
    segments,
    endCard: { start: start + 400, cta: spec.cta || "Start your family’s thread." },
  };
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const cfgIdx = args.indexOf("--config");
  const outIdx = args.indexOf("--out");
  const config = cfgIdx !== -1 ? JSON.parse(fs.readFileSync(args[cfgIdx + 1], "utf8")) : fathersDay();
  const opts = outIdx !== -1 ? { outDir: path.dirname(path.resolve(args[outIdx + 1])) } : {};
  generateShort(config, opts)
    .then((p) => console.log(`[tiktok] done → ${p}`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
