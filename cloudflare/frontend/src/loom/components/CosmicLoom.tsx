import { useEffect, useRef } from 'react';
import { DYES } from '../dye';
import type { ClothWhisperEntry, ClothSealRef } from './ClothWeave';

/**
 * CosmicLoom — the family thread rendered as a vast web of glowing filaments
 * adrift in cosmic dark. The Cosmic Loom design direction (Higgsfield "B"):
 * every family entry is a luminous warm filament; recent days burn bright,
 * ancestral ones fade toward the dark. Dyed entries carry their author's
 * colour. Sealed letters rest as small warm wax knots in the deep.
 *
 * Drop-in for ClothWeave — identical prop surface, identical `heirloom:weave`
 * ritual and touch-the-thread whispers — so ClothBackdrop swaps renderers
 * with a single tag and the whole app becomes Cosmic Loom at once.
 *
 * All colour is read from the loom CSS variables at paint time, so vault and
 * paper themes both stay honest — no literal hex lives in the data path.
 */

interface Filament {
  pts: number[][];
  color: string;      // resolved css colour (dye or warm)
  alpha: number;      // base luminance (recent bright → ancestral faint)
  width: number;
  entry: ClothWhisperEntry | null;
}

interface CosmicGeometry {
  filaments: Filament[];
  sealPts: { x: number; y: number; seal: ClothSealRef }[];
  W: number;
  H: number;
}

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
  if (!h.startsWith('#')) return '224,160,98';
  return `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;
}

export function CosmicLoom({
  entries,
  seals,
  interactive = false,
  onNavigate,
}: {
  entries?: ClothWhisperEntry[];
  seals?: ClothSealRef[];
  interactive?: boolean;
  onNavigate?: (route: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const webRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const whisperRef = useRef<HTMLDivElement>(null);
  const entriesRef = useRef(entries);
  const sealsRef = useRef(seals);
  const navRef = useRef(onNavigate);
  const paintRef = useRef<(() => void) | null>(null);
  entriesRef.current = entries;
  sealsRef.current = seals;
  navRef.current = onNavigate;

  useEffect(() => {
    const host = hostRef.current;
    const cv = webRef.current;
    const fxc = fxRef.current;
    const wsp = whisperRef.current;
    if (!host || !cv || !fxc || !wsp) return;
    const ctx = cv.getContext('2d');
    const fx = fxc.getContext('2d');
    if (!ctx || !fx) return;

    const loom = (host.closest('.loom') as HTMLElement) ?? document.documentElement;
    const GEO: Partial<CosmicGeometry> = {};
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    function paint() {
      if (!host || !cv || !fxc || !ctx || !fx) return;
      const cs = getComputedStyle(loom);
      const v = (name: string) => cs.getPropertyValue(name).trim();
      const paper = loom.getAttribute('data-theme') === 'light';
      const dyeHex: Record<string, string> = {};
      for (const d of DYES) dyeHex[d] = v(`--dye-${d}`) || '#e0a062';
      const ink = v('--ink') || (paper ? '#faf3e4' : '#0b0907');
      const inkRgb = hexRgb(ink);
      const warm = v('--warm') || '#e0a062';
      const warmRgb = hexRgb(v('--warm-bright') || warm);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      const W = Math.max(1, rect.width);
      const H = Math.max(1, rect.height);
      cv.width = W * dpr;
      cv.height = H * dpr;
      const t = ctx;
      t.setTransform(dpr, 0, 0, dpr, 0, 0);
      t.globalCompositeOperation = 'source-over';
      t.fillStyle = ink;
      t.fillRect(0, 0, W, H);
      t.lineCap = 'round';

      const rnd = mulberry(1941);

      // ── nebular depth — a few faint warm clouds, kept barely-there so it
      //    reads as deep space, never a 2026 gradient mesh ──────────────────
      t.globalCompositeOperation = 'lighter';
      const clouds = [
        [W * 0.5, H * 0.46, Math.max(W, H) * 0.55, paper ? 0.05 : 0.07],
        [W * 0.22, H * 0.3, Math.max(W, H) * 0.34, paper ? 0.03 : 0.045],
        [W * 0.8, H * 0.62, Math.max(W, H) * 0.4, paper ? 0.03 : 0.05],
      ];
      for (const [cx, cy, r, a] of clouds) {
        const g = t.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${warmRgb},${a})`);
        g.addColorStop(1, `rgba(${warmRgb},0)`);
        t.fillStyle = g;
        t.fillRect(0, 0, W, H);
      }

      // ── stars — faint dust in the deep ──────────────────────────────────
      const starCount = Math.round((W * H) / 14000);
      for (let i = 0; i < starCount; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const a = (paper ? 0.05 : 0.12) + rnd() * 0.18;
        t.fillStyle = `rgba(${warmRgb},${a})`;
        t.beginPath();
        t.arc(x, y, rnd() < 0.92 ? 0.6 : 1.3, 0, 7);
        t.fill();
      }

      // ── filaments — the family thread as a web of glowing light ─────────
      // entries first (dyed, real), then warm filler so the web feels deep.
      const list = entriesRef.current ?? [];
      // Density scales with the thread: a fuller cloth reads denser. Real
      // entries are always drawn; warm filler thins as the family's own
      // threads take over the web.
      const filler = list.length >= 40 ? 6 : 14;
      const target = Math.max(16, Math.min(56, list.length + filler));
      const filaments: Filament[] = [];
      const cy0 = H * 0.5;
      for (let i = 0; i < target; i++) {
        const entry = i < list.length ? list[i] : null;
        const color = entry ? (dyeHex[entry.dye] ?? warm) : warm;
        // band toward the centre, thinning to the edges → kept negative space
        const spread = (rnd() - 0.5) * H * 0.92;
        const baseY = cy0 + spread;
        const edgeFade = 1 - Math.min(1, Math.abs(spread) / (H * 0.5)) * 0.7;
        // recent (low i, real) burn brighter; ancestral fade
        const recency = entry ? 1 - i / Math.max(1, list.length) : 0.4 + rnd() * 0.3;
        const alpha = (0.16 + recency * 0.5) * edgeFade * (paper ? 0.7 : 1);
        const a1 = 18 + rnd() * 70;
        const a2 = 8 + rnd() * 34;
        const f1 = (0.4 + rnd() * 1.1) / W * Math.PI * 2;
        const f2 = (1.5 + rnd() * 2.5) / W * Math.PI * 2;
        const p1 = rnd() * Math.PI * 2;
        const p2 = rnd() * Math.PI * 2;
        const tilt = (rnd() - 0.5) * 0.5; // gentle diagonal drift
        const pts: number[][] = [];
        for (let x = -40; x <= W + 40; x += 7) {
          const y = baseY + tilt * (x - W / 2) + Math.sin(x * f1 + p1) * a1 + Math.sin(x * f2 + p2) * a2;
          pts.push([x, y]);
        }
        filaments.push({ pts, color, alpha, width: 1 + rnd() * 1.6, entry });
      }

      // sort faint→bright so bright filaments lie on top
      filaments.sort((a, b) => a.alpha - b.alpha);
      t.globalCompositeOperation = 'lighter';
      for (const f of filaments) drawFilament(t, f.pts, f.color, f.alpha, f.width);
      t.globalCompositeOperation = 'source-over';

      // ── sealed letters — warm wax knots resting in the deep ─────────────
      const sealPts: CosmicGeometry['sealPts'] = [];
      const sl = sealsRef.current ?? [];
      const nowYear = new Date().getFullYear();
      t.globalCompositeOperation = 'lighter';
      sl.forEach((s, i) => {
        const x = W * (0.18 + ((i * 0.618034) % 1) * 0.64);
        const y = H * (0.2 + ((i * 0.382 + 0.11) % 1) * 0.6);
        const yrs = Math.max(1, s.year - nowYear);
        const glow = Math.max(0.4, 1 - yrs / 60);
        t.shadowColor = `rgba(${warmRgb},${glow})`;
        t.shadowBlur = 16;
        t.fillStyle = `rgba(${warmRgb},${0.7 * glow})`;
        t.beginPath();
        t.arc(x, y, 2.6, 0, 7);
        t.fill();
        t.shadowBlur = 0;
        t.strokeStyle = `rgba(${warmRgb},${0.35 * glow})`;
        t.lineWidth = 1;
        t.beginPath();
        t.arc(x, y, 8, 0, 7);
        t.stroke();
        sealPts.push({ x, y, seal: s });
      });
      t.globalCompositeOperation = 'source-over';

      // a soft clearing behind centre type so headlines stay the hero
      const cx = W / 2;
      const cyc = H * 0.5;
      const cg = t.createRadialGradient(cx, cyc, 40, cx, cyc, Math.min(W * 0.5, 620));
      cg.addColorStop(0, `rgba(${inkRgb},${paper ? 0.7 : 0.5})`);
      cg.addColorStop(1, `rgba(${inkRgb},0)`);
      t.fillStyle = cg;
      t.fillRect(0, 0, W, H);
      // quiet band under the header chrome
      const tg = t.createLinearGradient(0, 0, 0, 140);
      tg.addColorStop(0, `rgba(${inkRgb},.85)`);
      tg.addColorStop(1, `rgba(${inkRgb},0)`);
      t.fillStyle = tg;
      t.fillRect(0, 0, W, 140);

      Object.assign(GEO, { filaments, sealPts, W, H });
      fxc.width = W * dpr;
      fxc.height = H * dpr;
      fx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fx.lineCap = 'round';
    }

    // a filament: soft outer glow + bright core, drawn additively
    function drawFilament(c: CanvasRenderingContext2D, pts: number[][], color: string, a: number, w: number) {
      c.strokeStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 14;
      c.globalAlpha = Math.min(0.5, a);
      c.lineWidth = w + 1.6;
      trace(c, pts);
      c.stroke();
      c.shadowBlur = 0;
      c.globalAlpha = Math.min(1, a * 1.4);
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

    paintRef.current = paint;
    paint();

    const ro = new ResizeObserver(() => paint());
    ro.observe(host);
    const mo = new MutationObserver(() => paint());
    mo.observe(loom, { attributes: true, attributeFilter: ['data-theme'] });

    // ── the weaving ritual: a save anywhere streaks a new filament of light ──
    let weaving = false;
    function onWeave(e: Event) {
      if (weaving || !fx || GEO.W === undefined) return;
      const cs = getComputedStyle(loom);
      const dyeName = ((e as CustomEvent).detail?.dye as string) || 'woad';
      const color = cs.getPropertyValue(`--dye-${dyeName}`).trim() || cs.getPropertyValue('--warm-bright').trim() || '#f0c074';
      const { W, H } = GEO as CosmicGeometry;
      const baseY = H * 0.5 + (Math.random() - 0.5) * H * 0.4;
      const amp = 30 + Math.random() * 50;
      const freq = (1 + Math.random() * 1.5) / W * Math.PI * 2;
      const ph = Math.random() * Math.PI * 2;
      const yAt = (x: number) => baseY + Math.sin(x * freq + ph) * amp;
      if (reduced) {
        fx.globalCompositeOperation = 'lighter';
        fx.beginPath();
        for (let x = -40; x <= W + 40; x += 7) (x <= -40 ? fx.moveTo(x, yAt(x)) : fx.lineTo(x, yAt(x)));
        fx.strokeStyle = color; fx.shadowColor = color; fx.shadowBlur = 12; fx.lineWidth = 2; fx.stroke();
        fx.shadowBlur = 0;
        setTimeout(() => fx.clearRect(0, 0, W, H), 1200);
        return;
      }
      weaving = true;
      const D = 1400;
      const t0 = performance.now();
      const step = (now: number) => {
        if (!fx) return;
        const p = Math.min(1, (now - t0) / D);
        const ease = 1 - Math.pow(1 - p, 4);
        fx.clearRect(0, 0, W, H);
        fx.globalCompositeOperation = 'lighter';
        const xe = -40 + ease * (W + 80);
        fx.beginPath();
        for (let x = -40; x <= xe; x += 7) (x <= -40 ? fx.moveTo(x, yAt(x)) : fx.lineTo(x, yAt(x)));
        fx.strokeStyle = color;
        fx.shadowColor = color;
        fx.shadowBlur = 16;
        fx.globalAlpha = 0.95;
        fx.lineWidth = 2.4;
        fx.stroke();
        // the shuttle — a warm point of light leading the new thread
        fx.shadowColor = '#f0c074';
        fx.shadowBlur = 22;
        fx.fillStyle = '#f0c074';
        fx.beginPath();
        fx.arc(Math.min(xe, W - 2), yAt(Math.min(xe, W - 2)), 3, 0, 7);
        fx.fill();
        fx.shadowBlur = 0;
        fx.globalAlpha = 1;
        if (p < 1) { raf = requestAnimationFrame(step); }
        else {
          paint(); // settle into the web for good
          setTimeout(() => fx.clearRect(0, 0, W, H), 600);
          weaving = false;
        }
      };
      raf = requestAnimationFrame(step);
    }
    window.addEventListener('heirloom:weave', onWeave);

    // ── the web remembers: touch a filament, it tells you whose day it was ──
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let touch: { route: string } | null = null;

    function hideWhisper() {
      if (!wsp || !fx) return;
      wsp.style.opacity = '0';
      if (GEO.W) fx.clearRect(0, 0, GEO.W as number, GEO.H as number);
      touch = null;
    }
    function showWhisper(nameHtml: string, body: string, x: number, y: number) {
      if (!wsp) return;
      const W = (GEO.W as number) ?? window.innerWidth;
      wsp.innerHTML =
        `<span style="display:block;margin-bottom:5px;font-style:normal;font-family:var(--mono);font-size:9px;letter-spacing:.26em;text-transform:uppercase;">${nameHtml}</span>${body}`;
      wsp.style.left = `${Math.min(Math.max(x + 20, 16), W - 340)}px`;
      wsp.style.top = `${Math.max(y - 52, 74)}px`;
      wsp.style.opacity = '1';
    }
    function bareTarget(e: Event): boolean {
      const el = e.target as Element | null;
      if (!el || !(el instanceof Element)) return false;
      return !el.closest('a,button,input,textarea,select,label,[role="button"],[data-no-whisper]');
    }

    function glowFilament(f: Filament) {
      if (!fx) return;
      fx.globalCompositeOperation = 'lighter';
      fx.strokeStyle = f.color;
      fx.shadowColor = f.color;
      fx.shadowBlur = 16;
      fx.globalAlpha = 0.9;
      fx.lineWidth = f.width + 1.4;
      fx.beginPath();
      fx.moveTo(f.pts[0][0], f.pts[0][1]);
      for (let k = 1; k < f.pts.length; k++) fx.lineTo(f.pts[k][0], f.pts[k][1]);
      fx.stroke();
      fx.shadowBlur = 0;
      fx.globalAlpha = 1;
    }

    function onMove(e: PointerEvent) {
      if (!GEO.filaments || weaving || !fx) return;
      if (e.clientY < 70 || !bareTarget(e)) { hideWhisper(); return; }
      const G = GEO as CosmicGeometry;
      fx.clearRect(0, 0, G.W, G.H);
      touch = null;
      // a sealed letter under the hand
      for (const sp of G.sealPts) {
        if (Math.hypot(e.clientX - sp.x, e.clientY - sp.y) < 18) {
          fx.globalCompositeOperation = 'lighter';
          fx.shadowColor = '#f0c074'; fx.shadowBlur = 22;
          fx.strokeStyle = 'rgba(240,192,116,.9)'; fx.lineWidth = 1.2;
          fx.beginPath(); fx.arc(sp.x, sp.y, 12, 0, 7); fx.stroke();
          fx.shadowBlur = 0;
          const from = sp.seal.from ? ` · from ${sp.seal.from}` : '';
          showWhisper(
            `<span style="color:var(--warm-bright)">a sealed letter${from}</span>`,
            `opens in ${sp.seal.year} — no one can open it early`,
            sp.x, sp.y,
          );
          touch = { route: sp.seal.route ?? '/loom/tied' };
          return;
        }
      }
      // nearest filament to the pointer
      let best: Filament | null = null;
      let bd = 16;
      for (const f of G.filaments) {
        const idx = Math.max(0, Math.min(f.pts.length - 1, Math.round((e.clientX + 40) / 7)));
        const d = Math.abs(f.pts[idx][1] - e.clientY);
        if (d < bd) { bd = d; best = f; }
      }
      if (!best) { hideWhisper(); return; }
      glowFilament(best);
      const entry = best.entry;
      if (entry) {
        showWhisper(
          `<span style="color:${best.color}">woven · <span style="color:var(--bone-faint)">${entry.year}</span></span>`,
          entry.title,
          e.clientX, e.clientY,
        );
        touch = { route: entry.route ?? '/loom/weft' };
      } else {
        showWhisper(
          `<span style="color:var(--bone-faint)">a thread in the deep</span>`,
          'threads like this one hold a family together',
          e.clientX, e.clientY,
        );
        touch = { route: '/loom/weft' };
      }
    }
    function onClick(e: MouseEvent) {
      if (!touch || !bareTarget(e)) return;
      const route = touch.route;
      hideWhisper();
      navRef.current?.(route);
    }
    function onScroll(e: Event) {
      const el = e.target instanceof Element ? e.target : document.scrollingElement;
      const top = el ? (el as Element).scrollTop : 0;
      const ty = `translateY(${top * -0.05}px)`;
      if (cv) cv.style.transform = ty;
      if (fxc) fxc.style.transform = ty;
      hideWhisper();
    }

    if (interactive && canHover) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('click', onClick);
    }
    if (!reduced) window.addEventListener('scroll', onScroll, { capture: true, passive: true });

    return () => {
      paintRef.current = null;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('heirloom:weave', onWeave);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  useEffect(() => {
    paintRef.current?.();
  }, [entries, seals]);

  return (
    <div ref={hostRef} aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas ref={webRef} className="hl-cloth-breath" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <canvas ref={fxRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <div
        ref={whisperRef}
        style={{
          position: 'fixed',
          zIndex: 40,
          maxWidth: 320,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 360ms var(--ease-out)',
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 16,
          lineHeight: 1.5,
          color: 'var(--bone)',
          textShadow: '0 1px 12px var(--ink)',
        }}
      />
    </div>
  );
}
