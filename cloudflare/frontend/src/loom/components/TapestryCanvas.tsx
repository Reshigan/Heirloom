import { useEffect, useRef, useState } from 'react';

// ─── Natural-dye palette — richer, more saturated pigments ──────────────────
export const HL_DYE_HEX: Record<string, string> = {
  madder:    '#e84030',  // deep scarlet
  cochineal: '#d42868',  // vivid crimson rose
  kermes:    '#f05268',  // bright coral-red
  saffron:   '#f5c832',  // deep gold-yellow
  weld:      '#edae2e',  // rich amber
  walnut:    '#a07040',  // warm chestnut
  oakgall:   '#7c5c4a',  // earthy umber
  woad:      '#4898d8',  // bright sky blue
  indigo:    '#3878e8',  // royal indigo
  iron:      '#4a4a46',  // charcoal slate
};

// Lighten a hex colour toward bone (#f4ecd8) by `t` (0..1)
function lightenToBone(hex: string, t: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (244 - r) * t)},${Math.round(g + (236 - g) * t)},${Math.round(b + (216 - b) * t)})`;
}

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

// Tier vertical bands
const TIER_Y: Record<string, [number, number]> = {
  family:     [0.08, 0.62],
  descendants:[0.64, 0.84],
  historian:  [0.86, 0.96],
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
  /** Index of a newly-woven entry; combined with flashPower to render weave-in glow. */
  flashIdx?: number | null;
  /** 0..1 power of the weave-in flash (1 = just woven, 0 = fully settled). */
  flashPower?: number;
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
    flashIdx = null,
    flashPower = 0,
  } = opts;

  const span = +tEnd - +tStart;

  // ─ background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  // ─ very subtle vertical cloth-sheen gradient (light source above centre)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   'rgba(244,236,216,0.028)');
  grad.addColorStop(0.4, 'rgba(244,236,216,0.055)');
  grad.addColorStop(1,   'rgba(244,236,216,0.010)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ─ warp — seeded irregular vertical hairlines with natural sag curve
  const rnd = hlSeed(7);
  for (let x = 0; x < W + 4; x += warpEvery) {
    const jitter = (rnd() - 0.5) * 1.4;
    const xx = x + jitter;
    const alpha = 0.06 + rnd() * 0.07;
    ctx.strokeStyle = `rgba(244,236,216,${alpha.toFixed(3)})`;
    ctx.lineWidth = 0.8 + rnd() * 0.4;
    ctx.beginPath();
    for (let y = 0; y <= H; y += 6) {
      const dx = Math.sin((y / H) * Math.PI) * sag * 5;
      if (y === 0) ctx.moveTo(xx + dx, y);
      else ctx.lineTo(xx + dx, y);
    }
    ctx.stroke();
  }

  // ─ weft (entries) — multi-strand fiber rendering
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const frac = (+e.date - +tStart) / span;
    const cx = frac * W - panX;
    if (cx < -50 || cx > W + 50) continue;
    if (e.sealed) continue;

    const tierKey = bandFromTier && e.tier ? e.tier : 'family';
    const [t0, t1] = TIER_Y[tierKey] ?? TIER_Y['family'];
    const yJitter = hlSeed(e.n * 131 + 19)();
    const cy = (t0 + yJitter * (t1 - t0)) * H;
    const sagY = Math.sin((cx / W) * Math.PI) * sag * H * 0.35;

    const rndW  = hlSeed(e.n * 17);
    const rndTh = hlSeed(e.n * 23);
    const rndBow = hlSeed(e.n * 41);

    const w = 10 + rndW() * 26;          // 10–36 px wide
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const midX = cx;
    const thick = 2.0 + rndTh() * 1.8;   // 2–3.8 px thick
    const bow = -(0.5 + rndBow() * 0.9); // slight upward catenary bow
    const midY = cy + sagY + bow;

    const color = HL_DYE_HEX[e.dye] ?? HL_DYE_HEX['weld'];
    const highlight = lightenToBone(color, 0.42);

    let alpha = 0.92;
    if (hoverAuthor && e.author !== hoverAuthor) alpha = 0.10;

    ctx.save();

    // Pass 1 — outer luminous glow
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * 0.06;
    ctx.lineWidth = thick + 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, cy + sagY);
    ctx.quadraticCurveTo(midX, midY, x1, cy + sagY);
    ctx.stroke();

    // Pass 2 — inner soft glow
    ctx.globalAlpha = alpha * 0.14;
    ctx.lineWidth = thick + 4;
    ctx.beginPath();
    ctx.moveTo(x0, cy + sagY);
    ctx.quadraticCurveTo(midX, midY, x1, cy + sagY);
    ctx.stroke();

    // Pass 3 — main thread body
    ctx.globalAlpha = alpha * 0.92;
    ctx.lineWidth = thick;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x0, cy + sagY);
    ctx.quadraticCurveTo(midX, midY, x1, cy + sagY);
    ctx.stroke();

    // Pass 4 — shadow strand (below main body, darker)
    ctx.globalAlpha = alpha * 0.38;
    ctx.lineWidth = thick * 0.55;
    ctx.beginPath();
    ctx.moveTo(x0 + 0.5, cy + sagY + thick * 0.72);
    ctx.quadraticCurveTo(midX, midY + thick * 0.72, x1 - 0.5, cy + sagY + thick * 0.72);
    ctx.stroke();

    // Pass 5 — highlight strand (above, lighter colour)
    ctx.strokeStyle = highlight;
    ctx.globalAlpha = alpha * 0.28;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(x0 + 1, cy + sagY - thick * 0.42);
    ctx.quadraticCurveTo(midX, midY - thick * 0.42, x1 - 1, cy + sagY - thick * 0.42);
    ctx.stroke();

    // Pass 6 — warp-crossing end marks (tiny vertical ticks where thread goes over warp)
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * 0.50;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, cy + sagY - thick * 0.9);
    ctx.lineTo(x0, cy + sagY + thick * 1.1);
    ctx.moveTo(x1, cy + sagY - thick * 0.9);
    ctx.lineTo(x1, cy + sagY + thick * 1.1);
    ctx.stroke();

    // Active entry — warm selection glow
    if (i === activeIdx) {
      ctx.strokeStyle = '#cf935a';
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0 - 4, cy + sagY);
      ctx.quadraticCurveTo(midX, midY - 0.5, x1 + 4, cy + sagY);
      ctx.stroke();
    }

    // Weave-in flash — newly woven entry bursts bright then settles
    if (i === flashIdx && flashPower > 0) {
      // Ease: cubic out so the burst is immediate and decay is gradual
      const p = 1 - Math.pow(1 - flashPower, 3);
      // Outer halo — wide warm ring
      ctx.strokeStyle = '#cf935a';
      ctx.globalAlpha = p * 0.28;
      ctx.lineWidth = thick + 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0 - 6, cy + sagY);
      ctx.quadraticCurveTo(midX, midY - 1, x1 + 6, cy + sagY);
      ctx.stroke();
      // Mid ring
      ctx.globalAlpha = p * 0.48;
      ctx.lineWidth = thick + 8;
      ctx.beginPath();
      ctx.moveTo(x0 - 3, cy + sagY);
      ctx.quadraticCurveTo(midX, midY - 0.5, x1 + 3, cy + sagY);
      ctx.stroke();
      // Inner bright filament — briefly bleaches to bone
      const flashColor = lightenToBone(color, p * 0.65);
      ctx.strokeStyle = flashColor;
      ctx.globalAlpha = p * 0.90;
      ctx.lineWidth = thick;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(x0, cy + sagY);
      ctx.quadraticCurveTo(midX, midY, x1, cy + sagY);
      ctx.stroke();
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // ─ sealed-note pegs — dashed tether + ∞ glyph
  for (const e of entries) {
    if (!e.sealed || !e.sealUntil) continue;
    const targetFrac = (+e.sealUntil - +tStart) / span;
    const cx = targetFrac * W - panX;
    if (cx < -10 || cx > W + 10) continue;
    const cy = 0.08 * H;
    ctx.strokeStyle = 'rgba(176,122,74,0.50)';
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
        ? 'rgba(244,236,216,0.65)'
        : isHalf
          ? 'rgba(244,236,216,0.40)'
          : 'rgba(244,236,216,0.22)';
      ctx.fillStyle = col;
      ctx.fillText(String(y), cx + 3, H - 14);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, H - 4);
      ctx.lineTo(cx, H - (isDecade ? 14 : isHalf ? 9 : 6));
      ctx.stroke();
    }
  }

  // ─ frayed selvedge — tendrils beyond the "now" position
  if (showFraySelvedge) {
    const nowFracEff = nowFrac == null ? 1 : nowFrac;
    const sx = nowFracEff * W - panX;
    const sxClamp = Math.min(W - 1, Math.max(0, sx));

    // selvedge edge column
    ctx.strokeStyle = 'rgba(244,236,216,0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sxClamp, 0);
    ctx.lineTo(sxClamp, H);
    ctx.stroke();

    // frayed warp tendrils (unfinished threads beyond the now edge)
    const fr = hlSeed(91);
    for (let i = 0; i < 70; i++) {
      const yy = fr() * H;
      const len = 3 + fr() * 22;
      const a = 0.08 + fr() * 0.20;
      ctx.strokeStyle = `rgba(244,236,216,${a.toFixed(3)})`;
      ctx.lineWidth = 0.5 + fr() * 0.7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sxClamp, yy);
      const dx = sxClamp + len;
      const dy = yy + fr() * 5 - 2.5;
      ctx.bezierCurveTo(sxClamp + len * 0.3, yy, sxClamp + len * 0.65, yy + 1.2, dx, dy);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // ─ warm unwoven thread — the active weft not yet beaten in
    {
      const tipY = 0.42 * H + Math.sin(performance.now() * 0.0008) * 5;
      const endX = sxClamp + 112;
      const endY = tipY + 16;
      const cp1x = sxClamp + 22, cp1y = tipY - 4;
      const cp2x = sxClamp + 68, cp2y = tipY + 9;

      // outermost halo
      ctx.strokeStyle = 'rgba(207,147,90,0.08)';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sxClamp, tipY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();

      // mid glow
      ctx.strokeStyle = 'rgba(207,147,90,0.20)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(sxClamp, tipY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();

      // inner glow
      ctx.strokeStyle = 'rgba(207,147,90,0.42)';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(sxClamp, tipY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();

      // core thread filament
      ctx.strokeStyle = '#cf935a';
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(sxClamp, tipY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();
      ctx.lineCap = 'butt';
    }
  }

  // ─ "now" warm warp hairline with subtle glow
  if (showWarpHair && nowFrac != null) {
    const xx = nowFrac * W - panX;

    // glow pass
    ctx.strokeStyle = 'rgba(176,122,74,0.14)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, H);
    ctx.stroke();

    // core hairline
    ctx.strokeStyle = '#b07a4a';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, H);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ─ sparkle (warm sparks during weave-in animations)
  if (sparkle > 0) {
    const sr = hlSeed(Math.floor(performance.now() / 100));
    for (let i = 0; i < 8; i++) {
      const xx = sr() * 80 + W - 110;
      const yy = sr() * H;
      const size = 0.6 + sr() * 1.6;
      const a = 0.5 * sparkle * (0.4 + sr() * 0.6);
      ctx.fillStyle = `rgba(207,147,90,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(xx, yy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── React component — auto-sizes to container via ResizeObserver ──────────
interface TapestryCanvasProps {
  width?: number;
  height: number;
  entries?: CanvasEntry[];
  kind?: 'full' | 'edge' | 'specimen' | 'century';
  opts?: DrawOpts;
  animate?: boolean;
  /** performance.now() timestamp set when a new entry is woven in. Triggers 1400ms flash. */
  newEntryAt?: number | null;
}

export function TapestryCanvas({
  width: widthProp,
  height,
  entries = [],
  kind = 'full',
  opts = {},
  animate = true,
  newEntryAt = null,
}: TapestryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const panRef = useRef<number>(opts.panX ?? 0);
  const newEntryAtRef = useRef<number | null>(newEntryAt);
  const [canvasW, setCanvasW] = useState<number>(
    widthProp ?? (typeof window !== 'undefined' ? window.innerWidth : 1280),
  );

  // Keep newEntryAt ref in sync so the RAF closure always reads the latest value
  useEffect(() => {
    newEntryAtRef.current = newEntryAt;
  }, [newEntryAt]);

  // Responsive width from container if no explicit width given
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
      const dt = now - last;
      last = now;

      if (animate && kind !== 'edge') {
        panRef.current += (kind === 'specimen' ? 0.06 : 0.014) * dt;
        if (panRef.current > 260) panRef.current = -60;
      }

      // Weave-in flash: decay over 1400ms from newEntryAt
      const FLASH_DUR = 1400;
      const flashAge = newEntryAtRef.current != null ? now - newEntryAtRef.current : Infinity;
      const flashPower = flashAge < FLASH_DUR ? Math.max(0, 1 - flashAge / FLASH_DUR) : 0;
      const flashIdx = flashPower > 0 ? entries.length - 1 : null;

      ctx.clearRect(0, 0, canvasW, height);
      drawCloth(ctx, canvasW, height, entries, {
        ...opts,
        panX: panRef.current,
        sparkle: flashPower > 0 ? flashPower * 0.8 : (opts.sparkle ?? 0),
        flashIdx,
        flashPower,
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasW, height, kind, animate]);

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
