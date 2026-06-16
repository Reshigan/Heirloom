import { useEffect, useRef } from 'react';

/**
 * Filament — a contained glowing-filament treatment for a single screen.
 *
 * The Cosmic Loom direction (Higgsfield "B") renders the family thread as warm
 * woven light. The earlier implementation hung ONE full-bleed web behind the
 * whole app; the golive reference screens instead show a *contained* filament
 * gesture per screen — a crescent ring at the top of the sign-in, a radiating
 * crown over the home prompt, horizontal waves under the hero, a centred ∞ at
 * the threshold. This component draws exactly one of those gestures inside its
 * own host box, so each screen wears its own light and nothing else.
 *
 * It reuses the same canvas math as CosmicLoom (mulberry PRNG, hexRgb, the
 * glow+core `drawFilament`, sine-traced points) and answers the same
 * `heirloom:weave` ritual — a shuttle of light streaks across whatever gesture
 * is on screen when a memory is woven. All colour is read from the loom CSS
 * variables at paint time, so vault and paper themes both stay honest.
 */

export type FilamentVariant =
  | 'arc'       // crescent ring hanging from the top — sign-in, composer, pricing, thread, threshold
  | 'crown'     // radiating aurora crown over the top third — home prompt
  | 'wave'      // horizontal woven waves across the bottom third — landing hero
  | 'infinity'  // a centred ∞ lemniscate knot — the threshold ceremony
  | 'ember'     // ∞ wax knot breaking open into rising embers — a letter unsealed
  | 'scurve'    // one vast faint S-curve behind giant numbers — the year wrapped
  | 'tree'      // two wing-sprays of light rising from the top — the lineage
  | 'none';     // clean ink — most reading/utility rooms

function mulberry(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexRgb(hex: string): string {
  const h = hex.trim();
  if (!h.startsWith('#')) return '176,122,74';
  return `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;
}

interface FilamentProps {
  variant?: FilamentVariant;
  /** Vary the woven texture per screen so two arcs don't look identical. */
  seed?: number;
  /** 0–1.4 — scales luminance + density. Rooms can dim their gesture. */
  intensity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Filament({ variant = 'none', seed = 1941, intensity = 1, className, style }: FilamentProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const webRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const cv = webRef.current;
    const fxc = fxRef.current;
    if (!host || !cv || !fxc) return;
    const ctx = cv.getContext('2d')!;
    const fx = fxc.getContext('2d')!;
    if (!ctx || !fx) return;

    const loom = (host.closest('.loom') as HTMLElement) ?? document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let W = 1;
    let H = 1;

    // ── shared filament stroke: soft outer glow + bright core, drawn additively ──
    function drawFilament(c: CanvasRenderingContext2D, pts: number[][], color: string, a: number, w: number) {
      if (pts.length < 2) return;
      c.strokeStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 14;
      c.globalAlpha = Math.min(0.55, a);
      c.lineWidth = w + 1.6;
      trace(c, pts);
      c.stroke();
      c.shadowBlur = 0;
      c.globalAlpha = Math.min(1, a * 1.5);
      c.lineWidth = Math.max(0.5, w * 0.5);
      trace(c, pts);
      c.stroke();
      c.globalAlpha = 1;
    }
    function trace(c: CanvasRenderingContext2D, pts: number[][]) {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]);
    }

    // ── geometry generators — each returns an array of point-paths ──────────────
    // A crescent ring hanging from the top: concentric arcs + a woven cross-weave
    // of radials, brightest along the lower curve.
    function arcPaths(rnd: () => number): { pts: number[][]; a: number; w: number }[] {
      const out: { pts: number[][]; a: number; w: number }[] = [];
      const cx = W / 2;
      const cy = -H * 0.12;
      const R = Math.min(W * 0.44, H * 0.4);
      const a0 = Math.PI * 0.16;
      const a1 = Math.PI * 0.84;
      const rings = 11;
      for (let i = 0; i < rings; i++) {
        const r = R * (0.5 + (i / (rings - 1)) * 0.5);
        const jitter = (0.6 + rnd() * 0.8) * 3;
        const pts: number[][] = [];
        for (let a = a0; a <= a1; a += 0.04) {
          const wob = Math.sin(a * (5 + i) + i) * jitter;
          pts.push([cx + Math.cos(a) * (r + wob), cy + Math.sin(a) * (r + wob)]);
        }
        // lower (outer-bottom) rings brighter
        out.push({ pts, a: 0.18 + (i / rings) * 0.42, w: 0.7 + rnd() * 0.7 });
      }
      const spokes = 26;
      for (let s = 0; s < spokes; s++) {
        const a = a0 + (s / (spokes - 1)) * (a1 - a0);
        const sway = (rnd() - 0.5) * 0.05;
        const pts: number[][] = [];
        for (let r = R * 0.46; r <= R * 1.02; r += 6) {
          const aa = a + sway * Math.sin(r * 0.03);
          pts.push([cx + Math.cos(aa) * r, cy + Math.sin(aa) * r]);
        }
        out.push({ pts, a: 0.1 + rnd() * 0.18, w: 0.5 + rnd() * 0.5 });
      }
      return out;
    }

    // A radiating crown: long curved filaments fanning down across the top third,
    // swirled by per-thread phase so it reads as aurora, not a clean fan.
    function crownPaths(rnd: () => number): { pts: number[][]; a: number; w: number }[] {
      const out: { pts: number[][]; a: number; w: number }[] = [];
      const cx = W / 2;
      const cy = -H * 0.06;
      const count = 30;
      const reach = H * 0.46;
      for (let i = 0; i < count; i++) {
        const base = Math.PI * (0.08 + (i / (count - 1)) * 0.84);
        const swirl = (rnd() - 0.5) * 0.9;
        const ph = rnd() * Math.PI * 2;
        const pts: number[][] = [];
        for (let r = 0; r <= reach; r += 7) {
          const t = r / reach;
          const a = base + swirl * t * t + Math.sin(t * 3 + ph) * 0.12 * t;
          pts.push([cx + Math.cos(a) * r * (0.7 + rnd() * 0.02), cy + Math.sin(a) * r]);
        }
        out.push({ pts, a: (0.12 + rnd() * 0.4) * (1 - i / count * 0.2), w: 0.6 + rnd() * 1.1 });
      }
      return out;
    }

    // Horizontal woven waves across the bottom third, flowing, brighter to the
    // right — the landing hero treatment.
    function wavePaths(rnd: () => number): { pts: number[][]; a: number; w: number }[] {
      const out: { pts: number[][]; a: number; w: number }[] = [];
      const count = 13;
      for (let i = 0; i < count; i++) {
        const baseY = H * (0.66 + (i / count) * 0.3);
        const a1 = 14 + rnd() * 40;
        const a2 = 6 + rnd() * 22;
        const f1 = (0.5 + rnd() * 1.1) / W * Math.PI * 2;
        const f2 = (1.5 + rnd() * 2.4) / W * Math.PI * 2;
        const p1 = rnd() * Math.PI * 2;
        const p2 = rnd() * Math.PI * 2;
        const tilt = (rnd() - 0.5) * 0.16;
        const pts: number[][] = [];
        for (let x = -30; x <= W + 30; x += 7) {
          const y = baseY + tilt * (x - W / 2) + Math.sin(x * f1 + p1) * a1 + Math.sin(x * f2 + p2) * a2;
          pts.push([x, y]);
        }
        // brighter to the right: fake by raising alpha on lower (later) waves
        out.push({ pts, a: 0.14 + rnd() * 0.34, w: 0.7 + rnd() * 1.2 });
      }
      return out;
    }

    // A lemniscate ∞ knot, centred in the upper third, drawn as a few offset
    // passes so it glows like a woven loop.
    function lemniscate(cx: number, cy: number, scale: number, jitter: number, phase: number): number[][] {
      const pts: number[][] = [];
      for (let t = 0; t <= Math.PI * 2 + 0.001; t += 0.05) {
        const d = 1 + Math.sin(t) * Math.sin(t);
        const wob = jitter * Math.sin(t * 6 + phase);
        const x = cx + (scale + wob) * Math.cos(t) / d;
        const y = cy + (scale + wob) * Math.sin(t) * Math.cos(t) / d;
        pts.push([x, y]);
      }
      return pts;
    }
    function infinityPaths(rnd: () => number): { pts: number[][]; a: number; w: number }[] {
      const out: { pts: number[][]; a: number; w: number }[] = [];
      const cx = W / 2;
      const cy = H * 0.34;
      const scale = Math.min(W * 0.3, H * 0.2);
      const passes = 7;
      for (let i = 0; i < passes; i++) {
        out.push({
          pts: lemniscate(cx, cy, scale * (0.86 + i * 0.045), 2 + rnd() * 3, rnd() * Math.PI * 2),
          a: 0.2 + (i / passes) * 0.45,
          w: 0.7 + rnd() * 0.9,
        });
      }
      return out;
    }

    // One vast faint S-curve down the page, behind giant numbers.
    function scurvePaths(rnd: () => number): { pts: number[][]; a: number; w: number }[] {
      const out: { pts: number[][]; a: number; w: number }[] = [];
      const passes = 3;
      for (let i = 0; i < passes; i++) {
        const cx = W * (0.52 + (rnd() - 0.5) * 0.06);
        const amp = W * (0.3 + i * 0.04);
        const f = (1.05 + rnd() * 0.2) / H * Math.PI * 2;
        const ph = -0.5 + rnd() * 0.4;
        const pts: number[][] = [];
        for (let y = -20; y <= H + 20; y += 8) {
          pts.push([cx + Math.sin(y * f + ph) * amp, y]);
        }
        out.push({ pts, a: 0.12 + i * 0.06, w: 1.4 + i * 0.8 });
      }
      return out;
    }

    // Two wing-sprays of light rising from the top centre — the lineage canopy.
    function treePaths(rnd: () => number): { pts: number[][]; a: number; w: number }[] {
      const out: { pts: number[][]; a: number; w: number }[] = [];
      const cx = W / 2;
      const cy = H * 0.34;
      const reach = Math.min(W * 0.5, H * 0.34);
      for (const dir of [-1, 1]) {
        const count = 22;
        for (let i = 0; i < count; i++) {
          const spread = (i / (count - 1)); // 0 → up, 1 → outward
          const baseA = -Math.PI / 2 + dir * (0.06 + spread * 1.02);
          const curve = dir * (0.2 + rnd() * 0.5);
          const ph = rnd() * Math.PI * 2;
          const pts: number[][] = [];
          for (let r = 0; r <= reach; r += 7) {
            const t = r / reach;
            const a = baseA + curve * t * t + Math.sin(t * 2.5 + ph) * 0.06;
            pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
          }
          out.push({ pts, a: 0.14 + rnd() * 0.4, w: 0.6 + rnd() * 1.0 });
        }
      }
      return out;
    }

    function pathsFor(variant: FilamentVariant, rnd: () => number) {
      switch (variant) {
        case 'arc': return arcPaths(rnd);
        case 'crown': return crownPaths(rnd);
        case 'wave': return wavePaths(rnd);
        case 'infinity':
        case 'ember': return infinityPaths(rnd);
        case 'scurve': return scurvePaths(rnd);
        case 'tree': return treePaths(rnd);
        default: return [];
      }
    }

    // Rising embers for the unsealed-letter ceremony — small warm motes drifting
    // up from the ∞ knot, animated.
    let emberMotes: { x: number; y: number; vy: number; r: number; life: number }[] = [];

    function paint() {
      if (!host || !cv || !ctx || !fxc) return;
      const cs = getComputedStyle(loom);
      const v = (name: string) => cs.getPropertyValue(name).trim();
      const paper = loom.getAttribute('data-theme') === 'light';
      const warm = v('--warm') || '#b07a4a';
      const warmRgb = hexRgb(v('--warm-bright') || warm);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      fxc.width = W * dpr;
      fxc.height = H * dpr;
      fx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fx.lineCap = 'round';

      if (variant === 'none') return;

      const rnd = mulberry(seed);
      const lum = (paper ? 0.6 : 1) * intensity;

      ctx.globalCompositeOperation = 'lighter';
      const paths = pathsFor(variant, rnd);
      for (const p of paths) drawFilament(ctx, p.pts, warm, p.a * lum, p.w);

      // The ∞ ceremony screens get a bright wax-knot core at the lemniscate centre.
      if (variant === 'infinity' || variant === 'ember') {
        const cx = W / 2;
        const cy = H * 0.34;
        const cr = Math.min(W * 0.3, H * 0.2) * (variant === 'ember' ? 0.5 : 0.34);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 2.4);
        g.addColorStop(0, `rgba(${warmRgb},${0.5 * lum})`);
        g.addColorStop(1, `rgba(${warmRgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        if (variant === 'ember' && emberMotes.length === 0) {
          emberMotes = Array.from({ length: 26 }, () => ({
            x: cx + (rnd() - 0.5) * cr * 1.4,
            y: cy + (rnd() - 0.5) * cr * 0.6,
            vy: -(0.2 + rnd() * 0.9),
            r: 0.6 + rnd() * 1.6,
            life: rnd(),
          }));
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    paint();

    // ── ember drift (only when motes exist) ──────────────────────────────────
    function emberStep() {
      if (variant !== 'ember' || reduced) return;
      const cs = getComputedStyle(loom);
      const warmRgb = hexRgb(cs.getPropertyValue('--warm-bright').trim() || '#cf935a');
      fx.clearRect(0, 0, W, H);
      fx.globalCompositeOperation = 'lighter';
      for (const m of emberMotes) {
        m.y += m.vy;
        m.life += 0.012;
        m.x += Math.sin(m.life * 3) * 0.3;
        const a = Math.max(0, 0.7 * (1 - (m.life % 1)));
        fx.shadowColor = `rgba(${warmRgb},${a})`;
        fx.shadowBlur = 10;
        fx.fillStyle = `rgba(${warmRgb},${a})`;
        fx.beginPath();
        fx.arc(m.x, m.y, m.r, 0, 7);
        fx.fill();
        if (m.y < H * 0.18 || m.life % 1 > 0.96) {
          m.y = H * 0.34;
          m.x = W / 2 + (Math.sin(m.life * 7) * W * 0.16);
          m.life = 0;
        }
      }
      fx.shadowBlur = 0;
      raf = requestAnimationFrame(emberStep);
    }
    if (variant === 'ember') raf = requestAnimationFrame(emberStep);

    const ro = new ResizeObserver(() => paint());
    ro.observe(host);
    const mo = new MutationObserver(() => paint());
    mo.observe(loom, { attributes: true, attributeFilter: ['data-theme'] });

    // ── the weaving ritual — a shuttle of light streaks across the gesture ────
    let weaving = false;
    function onWeave(e: Event) {
      if (weaving || variant === 'none') return;
      const cs = getComputedStyle(loom);
      const dyeName = ((e as CustomEvent).detail?.dye as string) || '';
      const color =
        (dyeName && cs.getPropertyValue(`--dye-${dyeName}`).trim()) ||
        cs.getPropertyValue('--warm-bright').trim() ||
        '#cf935a';
      const midY = variant === 'wave' ? H * 0.8 : variant === 'arc' || variant === 'crown' ? H * 0.18 : H * 0.34;
      const amp = 26 + (H * 0.04);
      const freq = 1.4 / W * Math.PI * 2;
      const yAt = (x: number) => midY + Math.sin(x * freq) * amp;
      if (reduced) {
        fx.globalCompositeOperation = 'lighter';
        trace(fx, Array.from({ length: Math.ceil((W + 80) / 7) }, (_, i) => { const x = -40 + i * 7; return [x, yAt(x)]; }));
        fx.strokeStyle = color; fx.shadowColor = color; fx.shadowBlur = 12; fx.lineWidth = 2; fx.stroke();
        fx.shadowBlur = 0;
        window.setTimeout(() => fx.clearRect(0, 0, W, H), 1200);
        return;
      }
      weaving = true;
      const D = 1400;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / D);
        const ease = 1 - Math.pow(1 - p, 4);
        fx.clearRect(0, 0, W, H);
        fx.globalCompositeOperation = 'lighter';
        const xe = -40 + ease * (W + 80);
        const pts: number[][] = [];
        for (let x = -40; x <= xe; x += 7) pts.push([x, yAt(x)]);
        if (pts.length > 1) {
          trace(fx, pts);
          fx.strokeStyle = color; fx.shadowColor = color; fx.shadowBlur = 16;
          fx.globalAlpha = 0.95; fx.lineWidth = 2.4; fx.stroke();
        }
        fx.shadowColor = '#cf935a'; fx.shadowBlur = 22; fx.fillStyle = '#cf935a';
        fx.beginPath(); fx.arc(Math.min(xe, W - 2), yAt(Math.min(xe, W - 2)), 3, 0, 7); fx.fill();
        fx.shadowBlur = 0; fx.globalAlpha = 1;
        if (p < 1) raf = requestAnimationFrame(step);
        else { paint(); window.setTimeout(() => { if (variant !== 'ember') fx.clearRect(0, 0, W, H); }, 600); weaving = false; }
      };
      raf = requestAnimationFrame(step);
    }
    window.addEventListener('heirloom:weave', onWeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('heirloom:weave', onWeave);
    };
  }, [variant, seed, intensity]);

  return (
    <div ref={hostRef} aria-hidden className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }}>
      <canvas ref={webRef} className="hl-cloth-breath" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <canvas ref={fxRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
    </div>
  );
}
