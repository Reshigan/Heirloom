import { useEffect, useRef } from 'react';
import { DYES, type Dye } from '../dye';

/**
 * ClothWeave — the cloth itself, hand-woven in canvas 2D.
 *
 * Every thread undulates: it rises where it crosses over and sinks where it
 * passes under, warp and weft phased opposite so the crossings agree. Below
 * the fell line the cloth is woven — the family's days. Above it, bare warp:
 * the unwoven future, where sealed letters rest as small wax knots.
 *
 * Touch a thread and the cloth remembers (interactive mode): a whisper names
 * the entry; a sealed knot says when it opens; the bare warp says those days
 * belong to those still to come.
 *
 * All colour is read from the loom CSS variables at paint time, so vault and
 * paper themes are both honest cloth — no literal hex lives here.
 */

export interface ClothWhisperEntry {
  /** First line of the whisper — the entry's title. */
  title: string;
  /** Year the entry belongs to (its lived date, not its row date). */
  year: number;
  dye: Dye;
  /** Where touching this thread takes you. */
  route?: string;
}

export interface ClothSealRef {
  /** The year the sealed letter opens. */
  year: number;
  /** Who sealed it — omitted when unknown. */
  from?: string;
  route?: string;
}

interface ClothGeometry {
  weftY: number[];
  weftC: (string | null)[];
  weftWd: number[];
  rowEntry: (ClothWhisperEntry | null)[];
  fellY: number;
  warpGap: number;
  weftGap: number;
  amp: number;
  W: number;
  H: number;
  rows: number;
  paper: boolean;
  sealPts: { x: number; y: number; seal: ClothSealRef }[];
}

/** Composer save → the thread crosses into the cloth at the fell, forever. */
export function weaveIntoCloth(dye?: Dye): void {
  window.dispatchEvent(new CustomEvent('heirloom:weave', { detail: { dye } }));
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

function hexA(hex: string, a: number): string {
  const h = hex.trim();
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function hexRgb(hex: string): string {
  const h = hex.trim();
  return `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;
}

export function ClothWeave({
  entries,
  seals,
  interactive = false,
  onNavigate,
}: {
  /** Real entries — dyed weft runs map onto these; whispers speak them. */
  entries?: ClothWhisperEntry[];
  /** Sealed letters waiting in the unwoven future. */
  seals?: ClothSealRef[];
  /** Enable touch-the-cloth whispers + click routing (hover pointers only). */
  interactive?: boolean;
  onNavigate?: (route: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const clothRef = useRef<HTMLCanvasElement>(null);
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
    const cv = clothRef.current;
    const fxc = fxRef.current;
    const wsp = whisperRef.current;
    if (!host || !cv || !fxc || !wsp) return;
    const ctx = cv.getContext('2d');
    const fx = fxc.getContext('2d');
    if (!ctx || !fx) return;

    const loom = (host.closest('.loom') as HTMLElement) ?? document.documentElement;
    const CLOTH: Partial<ClothGeometry> = {};
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function paint() {
      if (!host || !cv || !fxc || !ctx || !fx) return;
      const cs = getComputedStyle(loom);
      const v = (name: string) => cs.getPropertyValue(name).trim();
      const paper = loom.getAttribute('data-theme') === 'light';
      const dyeHex: Record<string, string> = {};
      for (const d of DYES) dyeHex[d] = v(`--dye-${d}`) || '#b07a4a';
      const ink = v('--ink') || (paper ? '#f5ece0' : '#0e0e0c');
      const inkRgb = hexRgb(ink);
      // thread fibre = the theme's text colour: bone on vault, near-ink on paper
      const base = paper ? '25,21,18' : '244,236,216';
      const warmBright = v('--warm-bright') || '#cf935a';
      const warmDim = v('--warm-dim') || '#8c5a30';

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      const W = Math.max(1, rect.width);
      const H = Math.max(1, rect.height);
      cv.width = W * dpr;
      cv.height = H * dpr;
      const t = ctx;
      t.setTransform(dpr, 0, 0, dpr, 0, 0);
      t.fillStyle = ink;
      t.fillRect(0, 0, W, H);
      t.lineCap = 'round';

      const rnd = mulberry(1941);
      const warpGap = 13;
      const weftGap = 15;
      const amp = 1.6; // how far a thread lifts/dips at each crossing
      const cols = Math.ceil(W / warpGap) + 2;
      const rows = Math.ceil(H / weftGap) + 2;
      const fellY = H * 0.62;

      const warpX: number[] = [];
      const warpWd: number[] = [];
      const warpAl: number[] = [];
      for (let j = 0; j < cols; j++) {
        warpX[j] = j * warpGap + (rnd() - 0.5) * 1.6;
        warpWd[j] = 1.9 + rnd() * 0.8;
        warpAl[j] = 0.12 + rnd() * 0.04;
      }

      // weft rows: runs of one dye — one entry's stretch of days in the cloth
      const list = entriesRef.current ?? [];
      const weftY: number[] = [];
      const weftC: (string | null)[] = [];
      const weftAl: number[] = [];
      const weftWd: number[] = [];
      const rowEntry: (ClothWhisperEntry | null)[] = [];
      let run = 0;
      let dye: string | null = null;
      let entry: ClothWhisperEntry | null = null;
      let nextEntry = 0;
      for (let i = 0; i < rows; i++) {
        weftY[i] = i * weftGap + (rnd() - 0.5) * 1.6;
        if (run <= 0) {
          if (rnd() < 0.32) {
            if (list.length > 0) {
              entry = list[nextEntry++ % list.length];
              dye = dyeHex[entry.dye] ?? dyeHex.madder;
            } else {
              entry = null;
              dye = dyeHex[DYES[Math.floor(rnd() * DYES.length)]];
            }
            run = 1 + Math.floor(rnd() * 2);
          } else {
            dye = null;
            entry = null;
            run = 1 + Math.floor(rnd() * 3);
          }
        }
        run--;
        if (dye) {
          weftC[i] = dye;
          weftAl[i] = (paper ? 0.5 : 0.4) + rnd() * 0.24;
        } else {
          weftC[i] = null;
          weftAl[i] = (paper ? 0.09 : 0.12) + rnd() * 0.04;
        }
        rowEntry[i] = dye ? entry : null;
        // above the fell the cloth thins to bare warp — the unwoven future
        if (weftY[i] < fellY * 0.4) weftAl[i] *= (weftY[i] / (fellY * 0.4)) * 0.45;
        weftWd[i] = 2.3 + rnd() * 1.1;
      }

      function trace(pts: number[][], ox: number, oy: number) {
        t.beginPath();
        t.moveTo(pts[0][0] + ox, pts[0][1] + oy);
        for (let k = 1; k < pts.length; k++) t.lineTo(pts[k][0] + ox, pts[k][1] + oy);
      }
      // a strand follows its undulation: shadow beneath, body, light catching the top
      function strand(pts: number[][], w: number, color: string, a: number, vertical: boolean) {
        t.strokeStyle = paper ? `rgba(120,100,80,${a * 0.45})` : `rgba(0,0,0,${Math.min(0.85, a * 2.2)})`;
        t.lineWidth = w + 1.2;
        trace(pts, 0, 0);
        t.stroke();
        t.strokeStyle = color;
        t.lineWidth = w;
        trace(pts, 0, 0);
        t.stroke();
        t.strokeStyle = paper ? 'rgba(255,252,244,.55)' : `rgba(252,247,234,${Math.min(0.5, a * 0.8)})`;
        t.lineWidth = Math.max(0.5, w * 0.28);
        t.globalAlpha = 0.55;
        trace(pts, vertical ? -w * 0.22 : 0, vertical ? 0 : -w * 0.22);
        t.stroke();
        t.globalAlpha = 1;
      }
      // each thread rises where it crosses over and sinks where it passes under —
      // warp and weft phased opposite so the crossings agree
      function warpPath(j: number, y0: number, y1: number): number[][] {
        const pts: number[][] = [];
        for (let y = y0; y <= y1; y += 4) pts.push([warpX[j] + Math.cos(Math.PI * (y / weftGap + j + 1)) * amp * 0.7, y]);
        return pts;
      }
      function weftPath(i: number): number[][] {
        const pts: number[][] = [];
        for (let x = -warpGap; x <= W + warpGap; x += 4) pts.push([x, weftY[i] + Math.cos(Math.PI * (x / warpGap + i)) * amp]);
        return pts;
      }

      for (let j = 0; j < cols; j++) strand(warpPath(j, -weftGap, H + weftGap), warpWd[j], `rgba(${base},${warpAl[j] * 0.85})`, warpAl[j], true);
      for (let i = 0; i < rows; i++) {
        const col = weftC[i] ? hexA(weftC[i] as string, weftAl[i]) : `rgba(${base},${weftAl[i]})`;
        strand(weftPath(i), weftWd[i], col, weftAl[i], false);
      }
      // interlace: at alternating crossings the warp passes back over the weft
      for (let j = 0; j < cols; j++) {
        for (let i = 0; i < rows; i++) {
          if ((i + j) % 2 === 0) continue;
          const y = weftY[i];
          strand(warpPath(j, y - weftGap * 0.62, y + weftGap * 0.62), warpWd[j], `rgba(${base},${Math.min(0.3, warpAl[j] * 1.5)})`, warpAl[j], true);
        }
      }
      // clearing behind the prompt so type stays the hero
      const cx = W / 2;
      const cy = H * 0.58;
      const g = t.createRadialGradient(cx, cy, 80, cx, cy, Math.min(W * 0.55, 680));
      g.addColorStop(0, `rgba(${inkRgb},${paper ? 0.96 : 0.72})`);
      g.addColorStop(0.55, `rgba(${inkRgb},${paper ? 0.62 : 0.4})`);
      g.addColorStop(1, `rgba(${inkRgb},0)`);
      t.fillStyle = g;
      t.fillRect(0, 0, W, H);
      // quiet band under the header so the chrome reads clean
      const tg = t.createLinearGradient(0, 0, 0, 150);
      tg.addColorStop(0, `rgba(${inkRgb},.88)`);
      tg.addColorStop(1, `rgba(${inkRgb},0)`);
      t.fillStyle = tg;
      t.fillRect(0, 0, W, 150);

      // sealed letters — small wax knots resting in the unwoven future
      const sealPts: ClothGeometry['sealPts'] = [];
      const sl = sealsRef.current ?? [];
      const nowYear = new Date().getFullYear();
      sl.forEach((s, i) => {
        const fxFrac = 0.18 + ((i * 0.618034) % 1) * 0.64;
        const x = W * fxFrac;
        const y = fellY - Math.max(1, s.year - nowYear) * 12;
        if (y < 70) return;
        t.shadowColor = 'rgba(207,147,90,.9)';
        t.shadowBlur = 14;
        t.fillStyle = paper ? warmDim : warmBright;
        t.beginPath();
        t.arc(x, y, 3, 0, 7);
        t.fill();
        t.shadowBlur = 0;
        t.strokeStyle = paper ? 'rgba(140,90,48,.5)' : 'rgba(207,147,90,.4)';
        t.lineWidth = 1;
        t.beginPath();
        t.arc(x, y, 7.5, 0, 7);
        t.stroke();
        sealPts.push({ x, y, seal: s });
      });

      // remember the geometry so the cloth can answer when touched
      Object.assign(CLOTH, { weftY, weftC, weftWd, rowEntry, fellY, warpGap, weftGap, amp, W, H, rows, paper, sealPts });
      fxc.width = W * dpr;
      fxc.height = H * dpr;
      fx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fx.lineCap = 'round';
    }

    paintRef.current = paint;
    paint();

    const ro = new ResizeObserver(() => paint());
    ro.observe(host);
    const mo = new MutationObserver(() => paint());
    mo.observe(loom, { attributes: true, attributeFilter: ['data-theme'] });

    // ── the weaving ritual: a save anywhere becomes a thread at the fell ──
    let weaving = false;
    function stampThread(color: string) {
      if (!ctx || CLOTH.fellY === undefined) return;
      const { fellY, warpGap, amp, W } = CLOTH as ClothGeometry;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = -warpGap; x <= W + warpGap; x += 4) {
        const y = fellY + Math.cos(Math.PI * (x / warpGap)) * amp;
        if (x <= -warpGap) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function onWeave(e: Event) {
      if (weaving || !fx || CLOTH.fellY === undefined) return;
      const cs = getComputedStyle(loom);
      const dyeName = ((e as CustomEvent).detail?.dye as string) || 'woad';
      const color = cs.getPropertyValue(`--dye-${dyeName}`).trim() || cs.getPropertyValue('--dye-woad').trim() || '#4f8a8a';
      const { fellY, warpGap, amp, W, H } = CLOTH as ClothGeometry;
      if (reduced) {
        stampThread(color);
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
        fx.beginPath();
        const xe = ease * (W + warpGap);
        for (let x = -warpGap; x <= xe; x += 4) {
          const y = fellY + Math.cos(Math.PI * (x / warpGap)) * amp;
          if (x <= -warpGap) fx.moveTo(x, y);
          else fx.lineTo(x, y);
        }
        fx.shadowColor = color;
        fx.shadowBlur = 14;
        fx.strokeStyle = color;
        fx.lineWidth = 3;
        fx.globalAlpha = 0.95;
        fx.stroke();
        fx.globalAlpha = 1;
        fx.shadowBlur = 0;
        // the shuttle: a warm point of light leading the thread
        fx.shadowColor = 'rgba(207,147,90,1)';
        fx.shadowBlur = 20;
        fx.fillStyle = '#cf935a';
        fx.beginPath();
        fx.arc(Math.min(xe, W - 2), fellY, 3, 0, 7);
        fx.fill();
        fx.shadowBlur = 0;
        if (p < 1) requestAnimationFrame(step);
        else {
          // the thread settles into the cloth — it is part of the fabric now
          stampThread(color);
          setTimeout(() => fx.clearRect(0, 0, W, H), 720);
          weaving = false;
        }
      };
      requestAnimationFrame(step);
    }
    window.addEventListener('heirloom:weave', onWeave);

    // ── the cloth remembers: touch a thread, it tells you whose day it was ──
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let touch: { route: string } | null = null;

    function hideWhisper() {
      if (!wsp || !fx) return;
      wsp.style.opacity = '0';
      if (CLOTH.W) fx.clearRect(0, 0, CLOTH.W as number, CLOTH.H as number);
      touch = null;
    }
    function showWhisper(nameHtml: string, body: string, x: number, y: number) {
      if (!wsp) return;
      const W = (CLOTH.W as number) ?? window.innerWidth;
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

    function onMove(e: PointerEvent) {
      if (!CLOTH.weftY || weaving || !fx) return;
      if (e.clientY < 70 || !bareTarget(e)) {
        hideWhisper();
        return;
      }
      const C = CLOTH as ClothGeometry;
      fx.clearRect(0, 0, C.W, C.H);
      touch = null;
      // a sealed letter under the hand
      for (const sp of C.sealPts) {
        if (Math.hypot(e.clientX - sp.x, e.clientY - sp.y) < 18) {
          fx.shadowColor = 'rgba(207,147,90,1)';
          fx.shadowBlur = 22;
          fx.strokeStyle = C.paper ? 'rgba(140,90,48,.9)' : 'rgba(207,147,90,.9)';
          fx.lineWidth = 1.2;
          fx.beginPath();
          fx.arc(sp.x, sp.y, 11, 0, 7);
          fx.stroke();
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
      // above the fell: the cloth not yet woven
      if (e.clientY < C.fellY - 10) {
        showWhisper(
          `<span style="color:var(--bone-faint)">not yet woven</span>`,
          'these days belong to those still to come',
          e.clientX, e.clientY,
        );
        touch = { route: '/compose' };
        return;
      }
      // a woven day: find whose thread this is
      let best = -1;
      let bd = 18;
      for (let i = 0; i < C.rows; i++) {
        if (!C.weftC[i]) continue;
        const d = Math.abs(C.weftY[i] - e.clientY);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      if (best < 0) {
        hideWhisper();
        return;
      }
      const dye = C.weftC[best] as string;
      const entry = C.rowEntry[best];
      // glow the touched thread along its full undulation
      fx.beginPath();
      for (let x = -C.warpGap; x <= C.W + C.warpGap; x += 4) {
        const y = C.weftY[best] + Math.cos(Math.PI * (x / C.warpGap + best)) * C.amp;
        if (x <= -C.warpGap) fx.moveTo(x, y);
        else fx.lineTo(x, y);
      }
      fx.shadowColor = dye;
      fx.shadowBlur = 12;
      fx.strokeStyle = dye;
      fx.lineWidth = C.weftWd[best] + 0.8;
      fx.globalAlpha = 0.9;
      fx.stroke();
      fx.globalAlpha = 1;
      fx.shadowBlur = 0;
      if (entry) {
        showWhisper(
          `<span style="color:${dye}">woven · <span style="color:var(--bone-faint)">${entry.year}</span></span>`,
          entry.title,
          e.clientX, C.weftY[best],
        );
        touch = { route: entry.route ?? '/loom/weft' };
      } else {
        // no entries yet — the cloth still answers, quietly
        let yr = new Date().getFullYear() - Math.round((C.weftY[best] - C.fellY) / C.weftGap) * 3;
        const floor = new Date().getFullYear() - 85;
        if (yr < floor) yr = floor;
        showWhisper(
          `<span style="color:${dye}">a day kept · <span style="color:var(--bone-faint)">${yr}</span></span>`,
          'threads like this one hold a family together',
          e.clientX, C.weftY[best],
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
      const ty = `translateY(${top * -0.06}px)`;
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
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('heirloom:weave', onWeave);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  // repaint when real data arrives
  useEffect(() => {
    paintRef.current?.();
  }, [entries, seals]);

  return (
    <div ref={hostRef} aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas ref={clothRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
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
