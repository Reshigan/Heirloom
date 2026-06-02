import { useEffect, useRef } from 'react';

// Exact port of heirloom-tapestry.jsx — drawCloth + Tapestry canvas component.
// All rendering is 2D canvas. PRNG-seeded so the same Thread renders identically.

// ─── Natural-dye palette (only inside the cloth) ─────────────────────────────
export const HL_DYE_HEX: Record<string, string> = {
  madder:   '#9f3a2a',
  cochineal: '#7a1f2b',
  kermes:   '#b14a4a',
  saffron:  '#c69a3a',
  weld:     '#a89248',
  walnut:   '#5b3a22',
  oakgall:  '#3a2e1f',
  woad:     '#3a4a6a',
  indigo:   '#1f3a5b',
  iron:     '#1c1c1a',
};

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

// Tier vertical bands — family takes the main body, descendants + historian below.
const TIER_Y: Record<string, [number, number]> = {
  family:     [0.10, 0.62],
  descendants:[0.64, 0.84],
  historian:  [0.86, 0.96],
};

export interface CanvasEntry {
  /** position as a 0..1 fraction of the time window */
  date: Date;
  /** seeding index for PRNG consistency */
  n: number;
  /** natural dye key */
  dye: string;
  /** vertical band */
  tier?: 'family' | 'descendants' | 'historian';
  /** author id for hover-dimming */
  author?: string;
  /** sealed entry — renders as a tethered ∞ peg, not a weft pick */
  sealed?: boolean;
  /** when the seal unlocks (for sealed entries) */
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
    warpEvery = 12,
    bandFromTier = true,
    sparkle = 0,
  } = opts;

  const span = +tEnd - +tStart;

  // ─ background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  // ─ subtle vertical gradient (cloth sag / light)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   'rgba(244,236,216,0.018)');
  grad.addColorStop(0.5, 'rgba(244,236,216,0.04)');
  grad.addColorStop(1,   'rgba(244,236,216,0.01)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ─ warp — seeded PRNG, irregular vertical hairlines with sag
  const rnd = hlSeed(7);
  ctx.lineWidth = 1;
  for (let x = 0; x < W + 4; x += warpEvery) {
    const jitter = (rnd() - 0.5) * 1.2;
    const xx = x + jitter;
    const alpha = 0.05 + rnd() * 0.05;
    ctx.strokeStyle = `rgba(244,236,216,${alpha.toFixed(3)})`;
    ctx.beginPath();
    for (let y = 0; y <= H; y += 8) {
      const dx = Math.sin((y / H) * Math.PI) * sag * 4;
      if (y === 0) ctx.moveTo(xx + dx, y);
      else ctx.lineTo(xx + dx, y);
    }
    ctx.stroke();
  }

  // ─ weft (entries)
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const frac = (+e.date - +tStart) / span;
    const cx = frac * W - panX;
    if (cx < -40 || cx > W + 40) continue;

    const tierKey = bandFromTier && e.tier ? e.tier : 'family';
    const [t0, t1] = TIER_Y[tierKey] ?? TIER_Y['family'];
    const yJitterRnd = hlSeed(e.n * 131 + 19)();
    const cy = (t0 + yJitterRnd * (t1 - t0)) * H;
    const sagY = Math.sin((cx / W) * Math.PI) * sag * H * 0.35;
    const w = 8 + hlSeed(e.n * 17)() * 18;   // 8–26px
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const color = HL_DYE_HEX[e.dye] ?? HL_DYE_HEX['weld'];

    if (e.sealed) continue;   // handled in sealed-peg pass below

    let alpha = 0.86;
    if (hoverAuthor && e.author !== hoverAuthor) alpha = 0.12;

    // primary weft pick
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.6 + hlSeed(e.n * 23)() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x0, cy + sagY);
    ctx.lineTo(x1, cy + sagY);
    ctx.stroke();

    // secondary shadow hairline — the "two parallel threads" weave look
    ctx.globalAlpha = alpha * 0.5;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x0 + 1, cy + sagY + 1.4);
    ctx.lineTo(x1 - 1, cy + sagY + 1.4);
    ctx.stroke();

    // active glow
    if (i === activeIdx) {
      ctx.strokeStyle = '#cf935a';
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 - 3, cy + sagY);
      ctx.lineTo(x1 + 3, cy + sagY);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // ─ sealed-note pegs — dashed tether + ∞ glyph above future unlock position
  for (const e of entries) {
    if (!e.sealed || !e.sealUntil) continue;
    const targetFrac = (+e.sealUntil - +tStart) / span;
    const cx = targetFrac * W - panX;
    if (cx < -10 || cx > W + 10) continue;
    const cy = 0.08 * H;
    ctx.strokeStyle = 'rgba(176,122,74,0.45)';
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx, 0.35 * H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#b07a4a';
    ctx.font = '300 14px "Source Serif 4", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('∞', cx, cy);
  }

  // ─ decade / year markers along the bottom
  if (showDecadeMarks) {
    const startY = tStart.getFullYear();
    const endY = tEnd.getFullYear();
    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let y = startY; y <= endY; y++) {
      const d = new Date(y, 0, 1);
      const cx = ((+d - +tStart) / span) * W - panX;
      if (cx < 0 || cx > W) continue;
      const isDecade = y % 10 === 0;
      const isHalf   = y % 5 === 0;
      const col = isDecade
        ? 'rgba(244,236,216,0.55)'
        : isHalf
          ? 'rgba(244,236,216,0.34)'
          : 'rgba(244,236,216,0.18)';
      ctx.fillStyle = col;
      ctx.fillText(String(y), cx + 3, H - 14);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, H - 4);
      ctx.lineTo(cx, H - (isDecade ? 12 : isHalf ? 8 : 6));
      ctx.stroke();
    }
  }

  // ─ frayed selvedge — tendrils right of the "now" position
  if (showFraySelvedge) {
    const nowFracEff = nowFrac == null ? 1 : nowFrac;
    const sx = nowFracEff * W - panX;
    const sxClamp = Math.min(W - 1, Math.max(0, sx));

    // column edge
    ctx.strokeStyle = 'rgba(244,236,216,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sxClamp, 0);
    ctx.lineTo(sxClamp, H);
    ctx.stroke();

    // frayed tendrils
    const fr = hlSeed(91);
    for (let i = 0; i < 60; i++) {
      const yy = fr() * H;
      const len = 2 + fr() * 18;
      const a = 0.10 + fr() * 0.18;
      ctx.strokeStyle = `rgba(244,236,216,${a.toFixed(3)})`;
      ctx.lineWidth = 0.6 + fr() * 0.6;
      ctx.beginPath();
      ctx.moveTo(sxClamp, yy);
      const dx = sxClamp + len;
      const dy = yy + fr() * 4 - 2;
      ctx.bezierCurveTo(sxClamp + len * 0.3, yy, sxClamp + len * 0.6, yy + 1, dx, dy);
      ctx.stroke();
    }

    // warm unwoven thread — always-present, tip breathes slowly
    ctx.strokeStyle = 'rgba(176,122,74,0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const tipY = 0.42 * H + Math.sin(performance.now() * 0.001) * 4;
    ctx.moveTo(sxClamp, tipY);
    ctx.bezierCurveTo(
      sxClamp + 24, tipY - 2,
      sxClamp + 60, tipY + 6,
      sxClamp + 96, tipY + 12,
    );
    ctx.stroke();
  }

  // ─ warm hairline — the "where am I now" marker
  if (showWarpHair && nowFrac != null) {
    const xx = nowFrac * W - panX;
    ctx.strokeStyle = '#b07a4a';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, H);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ─ sparkle (warm sparks during weave-in animations)
  if (sparkle > 0) {
    const sr = hlSeed(Math.floor(performance.now() / 100));
    ctx.fillStyle = `rgba(207,147,90,${(0.4 * sparkle).toFixed(3)})`;
    for (let i = 0; i < 6; i++) {
      const xx = sr() * 80 + W - 100;
      const yy = sr() * H;
      ctx.beginPath();
      ctx.arc(xx, yy, 0.8 + sr() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── React component ──────────────────────────────────────────────────────────

interface TapestryCanvasProps {
  width: number;
  height: number;
  entries?: CanvasEntry[];
  kind?: 'full' | 'edge' | 'specimen' | 'century';
  opts?: DrawOpts;
  animate?: boolean;
}

export function TapestryCanvas({
  width,
  height,
  entries = [],
  kind = 'full',
  opts = {},
  animate = true,
}: TapestryCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const panRef = useRef<number>(opts.panX ?? 0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width  = width  * dpr;
    c.height = height * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;

      if (animate && kind !== 'edge') {
        panRef.current += (kind === 'specimen' ? 0.06 : 0.012) * dt;
        if (panRef.current > 240) panRef.current = -40;
      }

      ctx.clearRect(0, 0, width, height);
      drawCloth(ctx, width, height, entries, { ...opts, panX: panRef.current });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, kind, animate]);

  return (
    <canvas
      ref={ref}
      style={{ width, height, display: 'block', background: 'transparent' }}
      aria-hidden
    />
  );
}
