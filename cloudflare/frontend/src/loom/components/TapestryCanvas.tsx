import { useEffect, useRef, useState } from 'react';

// ─── Natural-dye palette ─────────────────────────────────────────────────────
export const HL_DYE_HEX: Record<string, string> = {
  madder:    '#e84030',
  cochineal: '#d42868',
  kermes:    '#f05268',
  saffron:   '#f5c832',
  weld:      '#edae2e',
  walnut:    '#a07040',
  oakgall:   '#7c5c4a',
  woad:      '#4898d8',
  indigo:    '#3878e8',
  iron:      '#4a4a46',
};

// Blend hex color toward bone (#f4ecd8) for highlights
function lightenToBone(hex: string, t: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (244 - r) * t)},${Math.round(g + (236 - g) * t)},${Math.round(b + (216 - b) * t)})`;
}

// Darken toward ink (#0e0e0c) for shadows
function darkenToInk(hex: string, t: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * (1 - t))},${Math.round(g * (1 - t))},${Math.round(b * (1 - t))})`;
}

// Parse hex to rgba string for alpha control
function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

// Seeded PRNG — deterministic per entry so cloth is stable across redraws
function hlSeed(s: number) {
  let a = s | 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tier vertical bands — family gets the widest row
const TIER_Y: Record<string, [number, number]> = {
  family:      [0.06, 0.60],
  descendants: [0.63, 0.82],
  historian:   [0.85, 0.95],
};

export interface CanvasEntry {
  date: Date;
  n: number;
  dye: string;
  tier?: 'family' | 'descendants' | 'historian';
  author?: string;
  sealed?: boolean;
  sealUntil?: Date;
}

interface DrawOpts {
  panX?: number;
  tStart?: Date;
  tEnd?: Date;
  activeIdx?: number | null;
  hoverAuthor?: string | null;
  sag?: number;
  showDecadeMarks?: boolean;
  showFraySelvedge?: boolean;
  showWarpHair?: boolean;
  nowFrac?: number | null;
  background?: string;
  warpEvery?: number;
  bandFromTier?: boolean;
  sparkle?: number;
  flashIdx?: number | null;
  flashPower?: number;
  breathY?: number;
  /** Draw N ghost threads at 0.05 alpha behind real entries (shows target state) */
  ghostTargetCount?: number;
}

// ─── Premium thread renderer ────────────────────────────────────────────────
// Draws a single weft thread with: cylinder lighting, twist simulation,
// surface fuzz, and soft end-fray. Each thread looks like a real plied yarn.
function drawThread(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  cy: number,
  bow: number,
  color: string,
  thick: number,
  alpha: number,
  n: number,
  isActive: boolean,
  flashPow: number,
) {
  const midX = (x0 + x1) / 2;
  const midY = cy + bow;
  const rndF = hlSeed(n * 71 + 13);

  ctx.save();

  // ── 1. Ambient outer glow (large, very soft)
  ctx.strokeStyle = hexToRgba(color, alpha * 0.055);
  ctx.lineWidth = thick + 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, cy);
  ctx.quadraticCurveTo(midX, midY, x1, cy);
  ctx.stroke();

  // ── 2. Inner glow halo
  ctx.strokeStyle = hexToRgba(color, alpha * 0.12);
  ctx.lineWidth = thick + 5;
  ctx.beginPath();
  ctx.moveTo(x0, cy);
  ctx.quadraticCurveTo(midX, midY, x1, cy);
  ctx.stroke();

  // ── 3. Main thread body — cylinder gradient (specular top → pigment → shadow bottom)
  //       A vertical linear gradient simulates round-fiber cross-section lighting.
  const gy0 = midY - thick * 0.6 - 1;
  const gy1 = midY + thick * 0.6 + 1;
  const cGrad = ctx.createLinearGradient(midX, gy0, midX, gy1);
  cGrad.addColorStop(0,    lightenToBone(color, 0.68));   // specular apex
  cGrad.addColorStop(0.18, lightenToBone(color, 0.30));   // upper shoulder
  cGrad.addColorStop(0.45, color);                         // equator — true pigment
  cGrad.addColorStop(0.72, darkenToInk(color, 0.18));     // lower shoulder
  cGrad.addColorStop(1,    darkenToInk(color, 0.42));     // shadow nadir
  ctx.strokeStyle = cGrad;
  ctx.globalAlpha = alpha * 0.97;
  ctx.lineWidth = thick;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, cy);
  ctx.quadraticCurveTo(midX, midY, x1, cy);
  ctx.stroke();

  // ── 4. Twist strands — two plied fibers winding around the core.
  //       One starts above and crosses below at mid, the other is phased 180°.
  const tLen = x1 - x0;
  const tAmp = thick * 0.5;          // twist amplitude
  const tFreq = Math.PI * 2.2 / tLen; // ~1.1 full rotations over thread length
  const STEPS = Math.max(12, Math.round(tLen / 6));

  for (let s = 0; s < 2; s++) {
    const phaseOff = s * Math.PI;
    const strandColor = s === 0 ? lightenToBone(color, 0.22) : darkenToInk(color, 0.10);
    ctx.strokeStyle = hexToRgba(strandColor, 0);  // set via alpha below
    ctx.globalAlpha = alpha * 0.52;
    ctx.lineWidth = thick * 0.42;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = strandColor;
    ctx.beginPath();
    for (let j = 0; j <= STEPS; j++) {
      const t  = j / STEPS;
      const xx = x0 + tLen * t;
      const sagT = 4 * t * (1 - t); // quadratic sag interpolation
      const yy = cy + sagT * bow;
      const tw = tAmp * Math.sin(t * tLen * tFreq + phaseOff);
      if (j === 0) ctx.moveTo(xx, yy + tw);
      else         ctx.lineTo(xx, yy + tw);
    }
    ctx.stroke();
  }

  // ── 5. Surface fuzz — fine strands perpendicular to the thread axis
  //       Drawn at irregular intervals, like real textile fibers standing up.
  const fuzzCount = Math.floor((x1 - x0) / 9);
  ctx.lineWidth = 0.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = lightenToBone(color, 0.38);
  ctx.globalAlpha = alpha * 0.20;
  for (let f = 0; f < fuzzCount; f++) {
    const t = (f + 0.15 + rndF() * 0.7) / fuzzCount;
    const xx = x0 + tLen * t;
    const sagT = 4 * t * (1 - t);
    const yy = cy + sagT * bow;
    const fLen = 1.4 + rndF() * thick * 0.9;
    const fAng = (rndF() - 0.5) * 0.7; // small angle from vertical
    ctx.beginPath();
    ctx.moveTo(xx, yy - thick * 0.4);
    ctx.lineTo(xx + Math.sin(fAng) * fLen, yy - thick * 0.4 - fLen * Math.cos(fAng));
    ctx.stroke();
  }

  // ── 6. End fraying — micro-filaments diverging from thread ends
  for (let end = 0; end < 2; end++) {
    const ex = end === 0 ? x0 : x1;
    const ey = cy;
    const dir = end === 0 ? -1 : 1;
    const frayRnd = hlSeed(n * 53 + end * 17);
    for (let f = 0; f < 5; f++) {
      const spread = (f - 2) * (thick * 0.38);
      const fLen = thick * (1.8 + frayRnd() * 2.4);
      const curl = (frayRnd() - 0.5) * thick * 0.6;
      ctx.strokeStyle = hexToRgba(color, alpha * (0.22 - f * 0.03));
      ctx.globalAlpha = 1;
      ctx.lineWidth = 0.45;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex, ey + spread);
      ctx.quadraticCurveTo(
        ex + dir * fLen * 0.5, ey + spread + curl,
        ex + dir * fLen,       ey + spread * 1.3 + curl * 1.4,
      );
      ctx.stroke();
    }
  }

  // ── 7. Specular ridge — thin bright highlight along the top of the cylinder
  const specGrad = ctx.createLinearGradient(x0, cy, x1, cy);
  specGrad.addColorStop(0,   'rgba(244,236,216,0)');
  specGrad.addColorStop(0.12, `rgba(244,236,216,${alpha * 0.32})`);
  specGrad.addColorStop(0.5,  `rgba(244,236,216,${alpha * 0.42})`);
  specGrad.addColorStop(0.88, `rgba(244,236,216,${alpha * 0.32})`);
  specGrad.addColorStop(1,   'rgba(244,236,216,0)');
  ctx.strokeStyle = specGrad;
  ctx.globalAlpha = 1;
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x0, cy - thick * 0.38);
  ctx.quadraticCurveTo(midX, midY - thick * 0.38, x1, cy - thick * 0.38);
  ctx.stroke();

  // ── 8. Active selection — warm ring
  if (isActive) {
    ctx.strokeStyle = 'rgba(207,147,90,0.9)';
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x0 - 5, cy);
    ctx.quadraticCurveTo(midX, midY - 1, x1 + 5, cy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── 9. Weave-in flash — burst of warm light as thread is added
  if (flashPow > 0) {
    const p = 1 - Math.pow(1 - flashPow, 3); // cubic-out ease
    ctx.strokeStyle = '#cf935a';
    ctx.globalAlpha = p * 0.25;
    ctx.lineWidth = thick + 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0 - 8, cy);
    ctx.quadraticCurveTo(midX, midY - 2, x1 + 8, cy);
    ctx.stroke();

    ctx.globalAlpha = p * 0.50;
    ctx.lineWidth = thick + 8;
    ctx.beginPath();
    ctx.moveTo(x0 - 4, cy);
    ctx.quadraticCurveTo(midX, midY - 1, x1 + 4, cy);
    ctx.stroke();

    const flashColor = lightenToBone(color, p * 0.75);
    ctx.strokeStyle = flashColor;
    ctx.globalAlpha = p * 0.95;
    ctx.lineWidth = thick;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x0, cy);
    ctx.quadraticCurveTo(midX, midY, x1, cy);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawCloth(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  entries: CanvasEntry[],
  opts: DrawOpts = {},
) {
  const {
    panX = 0,
    tStart = new Date(2019, 0, 1),
    tEnd   = new Date(2027, 0, 1),
    activeIdx = null,
    hoverAuthor = null,
    sag = 0.018,
    showDecadeMarks = true,
    showFraySelvedge = true,
    showWarpHair = true,
    nowFrac = null,
    background = '#0e0e0c',
    warpEvery = 14,
    bandFromTier = true,
    sparkle = 0,
    flashIdx = null,
    flashPower = 0,
    breathY = 0,
  } = opts;

  const span = +tEnd - +tStart;

  // ── Background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  // ── Very subtle cloth-sheen gradient (diffuse overhead light)
  const sheen = ctx.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0,   'rgba(244,236,216,0.020)');
  sheen.addColorStop(0.35,'rgba(244,236,216,0.045)');
  sheen.addColorStop(0.7, 'rgba(244,236,216,0.030)');
  sheen.addColorStop(1,   'rgba(244,236,216,0.008)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  // ── Warp threads — structural vertical fibres, slightly more visible now
  //    Each warp gets: soft glow pass + core hairline + occasional highlight
  const warpXs: number[] = [];  // collected for interlace pass
  const rnd = hlSeed(7);
  for (let x = 0; x < W + 4; x += warpEvery) {
    const jitter = (rnd() - 0.5) * 1.8;
    const xx = x + jitter;
    warpXs.push(xx);
    const baseAlpha = 0.09 + rnd() * 0.09;
    const isHighlight = rnd() > 0.72;

    // Glow pass
    ctx.strokeStyle = `rgba(244,236,216,${(baseAlpha * 0.4).toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    for (let y = 0; y <= H; y += 8) {
      const warpSag = Math.sin((y / H) * Math.PI) * sag * 4;
      if (y === 0) ctx.moveTo(xx + warpSag, y);
      else ctx.lineTo(xx + warpSag, y);
    }
    ctx.stroke();

    // Core warp thread
    ctx.strokeStyle = `rgba(244,236,216,${baseAlpha.toFixed(3)})`;
    ctx.lineWidth = 0.7 + rnd() * 0.5;
    ctx.beginPath();
    for (let y = 0; y <= H; y += 8) {
      const warpSag = Math.sin((y / H) * Math.PI) * sag * 4;
      if (y === 0) ctx.moveTo(xx + warpSag, y);
      else ctx.lineTo(xx + warpSag, y);
    }
    ctx.stroke();

    // Occasional warp highlight (linen sheen)
    if (isHighlight) {
      ctx.strokeStyle = `rgba(244,236,216,${(baseAlpha * 0.6).toFixed(3)})`;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (let y = 0; y <= H; y += 8) {
        const warpSag = Math.sin((y / H) * Math.PI) * sag * 4 - 0.8;
        if (y === 0) ctx.moveTo(xx + warpSag, y);
        else ctx.lineTo(xx + warpSag, y);
      }
      ctx.stroke();
    }
  }

  // ── Ghost cloth pass — drawn BEFORE real entries (shows target/potential state)
  const { ghostTargetCount = 0 } = opts;
  interface WeftInfo { x0: number; x1: number; cy: number; bow: number; thick: number; }
  const visibleWefts: WeftInfo[] = [];

  if (ghostTargetCount > 0) {
    const dyeKeys = Object.keys(HL_DYE_HEX);
    for (let gi = 0; gi < ghostTargetCount; gi++) {
      const gFrac = gi / ghostTargetCount;
      const gcx   = gFrac * W; // ghost threads fixed, no pan
      const grndW   = hlSeed(gi * 17 + 7777);
      const grndTh  = hlSeed(gi * 23 + 7777);
      const grndBow = hlSeed(gi * 41 + 7777);
      const grndY   = hlSeed(gi * 131 + 7796);
      const grndD   = hlSeed(gi * 53 + 7777);
      const halfLen = 38 + grndW() * 72;
      const cyFrac = 0.06 + grndY() * 0.54;
      const cy = cyFrac * H;
      const bow = -(0.4 + grndBow() * 0.8);
      const thick = 2.8 + grndTh() * 1.8;
      const dye = dyeKeys[Math.floor(grndD() * dyeKeys.length)];
      const color = HL_DYE_HEX[dye] ?? HL_DYE_HEX['weld'];
      drawThread(ctx, gcx - halfLen, gcx + halfLen, cy, bow, color, thick, 0.045, gi, false, 0);
    }
    ctx.globalAlpha = 1;
  }

  // ── Weft (entries) — premium thread rendering
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];

    const frac = (+e.date - +tStart) / span;
    const cx = frac * W - panX;
    if (cx < -200 || cx > W + 200) continue;

    const tierKey = bandFromTier && e.tier ? e.tier : 'family';
    const [t0, t1] = TIER_Y[tierKey] ?? TIER_Y['family'];

    // Deterministic per-entry PRNG for all random properties
    const rndW   = hlSeed(e.n * 17);
    const rndTh  = hlSeed(e.n * 23);
    const rndBow = hlSeed(e.n * 41);
    const rndY   = hlSeed(e.n * 131 + 19);

    // Thread dimensions — significantly longer than before for realism
    const halfLen = 38 + rndW() * 72;      // 38–110 px half-width → total 76–220 px
    const x0 = cx - halfLen;
    const x1 = cx + halfLen;

    const yFrac = t0 + rndY() * (t1 - t0);
    // breathY: slow sinusoidal cloth breathing (amplitude varies by thread position)
    const breathAmp = 0.5 + Math.abs(Math.sin(e.n * 1.37)) * 0.5;
    const cy = yFrac * H + breathY * breathAmp;
    const sagY = Math.sin((cx / W) * Math.PI) * sag * H * 0.28;

    const thick = 2.8 + rndTh() * 1.8;    // 2.8–4.6 px
    const bow = -(0.4 + rndBow() * 0.8) + sagY; // slight catenary bow + cloth sag

    const color = HL_DYE_HEX[e.dye] ?? HL_DYE_HEX['weld'];

    // Sealed entries appear at reduced alpha — they're woven but not yet readable
    let alpha = e.sealed ? 0.38 : 0.93;
    if (hoverAuthor && e.author !== hoverAuthor) alpha = e.sealed ? 0.12 : 0.08;

    const isActive = i === activeIdx;
    const isFlash  = i === flashIdx && flashPower > 0;
    const fPow     = isFlash ? flashPower : 0;

    drawThread(ctx, x0, x1, cy, bow, color, thick, alpha, e.n, isActive, fPow);
    visibleWefts.push({ x0, x1, cy, bow, thick });
  }

  ctx.globalAlpha = 1;

  // ── Interlace pass — warp-over-weft segments (plain weave over/under)
  //    For each warp thread that crosses a weft, alternating warps go OVER the weft,
  //    creating the authentic plain weave interlace pattern.
  ctx.lineCap = 'butt';
  for (let wi = 0; wi < warpXs.length; wi++) {
    const xx = warpXs[wi];
    for (let ei = 0; ei < visibleWefts.length; ei++) {
      const w = visibleWefts[ei];
      if (xx <= w.x0 || xx >= w.x1) continue;
      if ((wi + ei) % 2 !== 0) continue; // this warp goes under this weft — skip
      // Compute weft Y at this warp X position (quadratic sag interpolation)
      const t   = (xx - w.x0) / (w.x1 - w.x0);
      const sagT = 4 * t * (1 - t);
      const wy   = w.cy + sagT * w.bow;
      const segH = w.thick * 0.85;
      // Draw short warp-over-weft segment (bone linen, soft glow + hairline)
      const ovGrad = ctx.createLinearGradient(xx - 1, wy - segH, xx + 1, wy + segH);
      ovGrad.addColorStop(0,   'rgba(244,236,216,0.04)');
      ovGrad.addColorStop(0.35,'rgba(244,236,216,0.16)');
      ovGrad.addColorStop(0.5, 'rgba(244,236,216,0.22)');
      ovGrad.addColorStop(0.65,'rgba(244,236,216,0.16)');
      ovGrad.addColorStop(1,   'rgba(244,236,216,0.04)');
      ctx.strokeStyle = ovGrad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(xx, wy - segH);
      ctx.lineTo(xx, wy + segH);
      ctx.stroke();
      // Specular nub on the crimp where warp passes over weft
      ctx.strokeStyle = 'rgba(244,236,216,0.18)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(xx - 0.4, wy - segH * 0.5);
      ctx.lineTo(xx - 0.4, wy + segH * 0.3);
      ctx.stroke();
    }
  }

  // ── Sealed-note pegs — dashed tether + ∞ glyph
  for (const e of entries) {
    if (!e.sealed || !e.sealUntil) continue;
    const targetFrac = (+e.sealUntil - +tStart) / span;
    const cx = targetFrac * W - panX;
    if (cx < -10 || cx > W + 10) continue;
    const cy = 0.07 * H;
    ctx.strokeStyle = 'rgba(176,122,74,0.45)';
    ctx.setLineDash([2, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx, 0.34 * H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#b07a4a';
    ctx.font = '300 14px "Source Serif 4", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('∞', cx, cy);
  }

  // ── Decade / year markers along the bottom selvedge
  if (showDecadeMarks) {
    const startY = tStart.getFullYear();
    const endY   = tEnd.getFullYear();
    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let y = startY; y <= endY; y++) {
      const d  = new Date(y, 0, 1);
      const cx = ((+d - +tStart) / span) * W - panX;
      if (cx < 0 || cx > W) continue;
      const isDecade = y % 10 === 0;
      const isHalf   = y % 5 === 0;
      const col = isDecade
        ? 'rgba(244,236,216,0.60)'
        : isHalf
          ? 'rgba(244,236,216,0.36)'
          : 'rgba(244,236,216,0.18)';
      ctx.fillStyle = col;
      ctx.fillText(String(y), cx + 3, H - 15);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, H - 4);
      ctx.lineTo(cx, H - (isDecade ? 15 : isHalf ? 9 : 6));
      ctx.stroke();
    }
  }

  // ── Frayed selvedge — the "now" edge of the cloth
  if (showFraySelvedge) {
    const nowFracEff = nowFrac == null ? 1 : nowFrac;
    const sx = nowFracEff * W - panX;
    const sxClamp = Math.min(W - 1, Math.max(0, sx));

    // Selvedge column — very faint
    ctx.strokeStyle = 'rgba(244,236,216,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sxClamp, 0);
    ctx.lineTo(sxClamp, H);
    ctx.stroke();

    // Frayed warp tendrils beyond the now-edge
    const fr = hlSeed(91);
    for (let i = 0; i < 80; i++) {
      const yy  = fr() * H;
      const len = 4 + fr() * 26;
      const a   = 0.06 + fr() * 0.17;
      ctx.strokeStyle = `rgba(244,236,216,${a.toFixed(3)})`;
      ctx.lineWidth = 0.4 + fr() * 0.7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sxClamp, yy);
      const dx = sxClamp + len;
      const dy = yy + fr() * 6 - 3;
      ctx.bezierCurveTo(sxClamp + len * 0.3, yy, sxClamp + len * 0.65, yy + 1.5, dx, dy);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // Active weft tip — the warm thread being woven right now
    {
      const tipY = 0.42 * H + Math.sin(performance.now() * 0.0007) * 6;
      const endX = sxClamp + 120;
      const endY = tipY + 18;
      const cp1x = sxClamp + 24, cp1y = tipY - 5;
      const cp2x = sxClamp + 72, cp2y = tipY + 10;

      // Wide outer halo
      ctx.strokeStyle = 'rgba(207,147,90,0.06)';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sxClamp, tipY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(207,147,90,0.18)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(sxClamp, tipY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(207,147,90,0.40)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sxClamp, tipY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();

      ctx.strokeStyle = '#cf935a';
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(sxClamp, tipY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();
      ctx.lineCap = 'butt';
    }
  }

  // ── "Now" warp hairline — warm vertical at today's position
  if (showWarpHair && nowFrac != null) {
    const xx = nowFrac * W - panX;

    ctx.strokeStyle = 'rgba(176,122,74,0.12)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, H);
    ctx.stroke();

    ctx.strokeStyle = '#b07a4a';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, H);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── Sparkle (warm motes during weave-in animations)
  if (sparkle > 0) {
    const sr = hlSeed(Math.floor(performance.now() / 80));
    for (let i = 0; i < 10; i++) {
      const xx = sr() * 100 + W - 130;
      const yy = sr() * H;
      const sz = 0.5 + sr() * 1.8;
      const a  = 0.45 * sparkle * (0.35 + sr() * 0.65);
      ctx.fillStyle = `rgba(207,147,90,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(xx, yy, sz, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── React component ────────────────────────────────────────────────────────
interface TapestryCanvasProps {
  width?: number;
  height: number;
  entries?: CanvasEntry[];
  kind?: 'full' | 'edge' | 'specimen' | 'century';
  opts?: DrawOpts;
  animate?: boolean;
  newEntryAt?: number | null;
  /** Disable horizontal panning — shows the cloth at a fixed position */
  noPan?: boolean;
}

export function TapestryCanvas({
  width: widthProp,
  height,
  entries = [],
  kind = 'full',
  opts = {},
  animate = true,
  newEntryAt = null,
  noPan = false,
}: TapestryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const panRef = useRef<number>(opts.panX ?? 0);
  const newEntryAtRef = useRef<number | null>(newEntryAt);
  // Mirror entries and opts into refs so the animation loop always draws the
  // latest values without restarting the rAF loop on every change.
  const entriesRef = useRef(entries);
  const optsRef    = useRef(opts);
  const [canvasW, setCanvasW] = useState<number>(
    widthProp ?? (typeof window !== 'undefined' ? window.innerWidth : 1280),
  );

  useEffect(() => { newEntryAtRef.current = newEntryAt; }, [newEntryAt]);
  useEffect(() => { entriesRef.current = entries; },      [entries]);
  useEffect(() => { optsRef.current = opts; });           // always sync, no dep needed

  useEffect(() => {
    if (widthProp !== undefined) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCanvasW(entry.contentRect.width || window.innerWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [widthProp]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || canvasW <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width  = canvasW * dpr;
    c.height = height  * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt  = now - last;
      last = now;

      if (animate && kind !== 'edge' && !noPan) {
        panRef.current += (kind === 'specimen' ? 0.055 : 0.012) * dt;
        if (panRef.current > 280) panRef.current = -80;
      }

      const FLASH_DUR = 1400;
      const cur = entriesRef.current;
      const o   = optsRef.current;
      const flashAge   = newEntryAtRef.current != null ? now - newEntryAtRef.current : Infinity;
      const flashPower = flashAge < FLASH_DUR ? Math.max(0, 1 - flashAge / FLASH_DUR) : 0;
      const flashIdx   = flashPower > 0 ? cur.length - 1 : null;

      // Cloth breathing — very slow sinusoidal vertical oscillation (~28s period)
      const breathY = Math.sin(now * 0.000226) * 2.2;

      ctx.clearRect(0, 0, canvasW, height);
      drawCloth(ctx, canvasW, height, cur, {
        ...o,
        panX: noPan ? 0 : panRef.current,
        sparkle: flashPower > 0 ? flashPower * 0.7 : (o.sparkle ?? 0),
        flashIdx,
        flashPower,
        breathY,
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasW, height, kind, animate, noPan]);

  return (
    <div ref={containerRef} style={{ width: widthProp ?? '100%', height, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: canvasW, height, display: 'block' }}
        aria-hidden
      />
    </div>
  );
}
