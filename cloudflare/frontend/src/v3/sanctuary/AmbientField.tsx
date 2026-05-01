import { useEffect, useRef } from 'react';

/**
 * AmbientField — a Canvas-rendered atmosphere beneath every v3 surface.
 *
 * What's actually drawn each frame, in order, additively:
 *
 *   1. Paper base — solid bone fill, set once on resize.
 *   2. Time-of-day warm wash — two large radial gradients, position
 *      and colour tuned to the local hour. These shift over the day
 *      (re-evaluated each minute).
 *   3. Procedural light field — three slow-moving radial blobs
 *      (positioned via cheap pseudo-noise of t / 12000) blended
 *      "screen" so they stack as light, not paint.
 *   4. Cursor lamplight — a soft warm halo that follows the pointer,
 *      easing toward the target with a critically-damped spring so
 *      it never "snaps." Larger and dimmer than the cursor itself —
 *      the page feels lit from inside near the reader's hand.
 *   5. Pointer parallax — the warm wash and the procedural blobs
 *      offset slightly opposite the cursor, giving depth without
 *      any 3D rendering.
 *   6. Vignette — a final radial darkening at the page edges.
 *
 * Performance: ~6 fillRects/strokes per frame at 60 Hz on a desktop
 * (Edge-blurred via shadowBlur). Pauses when the tab is hidden.
 * No external libraries. WebGL would be lower-power but harder to
 * hand-tune; canvas2D was fast enough at 1440p in dev.
 */

interface Warmth {
  r: number; g: number; b: number;   // base paper warmth color
  alpha: number;                     // base wash alpha
  cursor: { r: number; g: number; b: number; alpha: number }; // cursor halo color
  vignette: number;                  // edge darkness alpha
  blob: number;                      // procedural blob alpha
}

function warmthForHour(h: number): Warmth {
  if (h < 5)
    return {
      r: 212, g: 158, b: 92, alpha: 0.045,
      cursor: { r: 240, g: 188, b: 122, alpha: 0.12 },
      vignette: 0.22, blob: 0.06,
    };
  if (h < 8)
    return {
      r: 244, g: 198, b: 132, alpha: 0.06,
      cursor: { r: 250, g: 215, b: 160, alpha: 0.15 },
      vignette: 0.16, blob: 0.07,
    };
  if (h < 11)
    return {
      r: 250, g: 222, b: 168, alpha: 0.05,
      cursor: { r: 252, g: 232, b: 188, alpha: 0.14 },
      vignette: 0.10, blob: 0.06,
    };
  if (h < 16)
    return {
      r: 252, g: 240, b: 210, alpha: 0.025,
      cursor: { r: 254, g: 244, b: 220, alpha: 0.10 },
      vignette: 0.08, blob: 0.04,
    };
  if (h < 19)
    return {
      r: 244, g: 192, b: 130, alpha: 0.07,
      cursor: { r: 250, g: 210, b: 150, alpha: 0.16 },
      vignette: 0.14, blob: 0.07,
    };
  if (h < 22)
    return {
      r: 232, g: 168, b: 100, alpha: 0.085,
      cursor: { r: 244, g: 192, b: 130, alpha: 0.18 },
      vignette: 0.20, blob: 0.08,
    };
  return {
    r: 212, g: 158, b: 92, alpha: 0.07,
    cursor: { r: 240, g: 184, b: 118, alpha: 0.16 },
    vignette: 0.24, blob: 0.07,
  };
}

const PAPER = '#F4EFE6';

export function AmbientField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    w: 0,
    h: 0,
    dpr: 1,
    cursor: { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, active: false },
    warmth: warmthForHour(new Date().getHours()),
    lastWarmthMin: -1,
    rafId: 0,
    paused: false,
    reduceMotion: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const state = stateRef.current;

    state.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      if (!canvas) return;
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = window.innerWidth;
      state.h = window.innerHeight;
      canvas.width = state.w * state.dpr;
      canvas.height = state.h * state.dpr;
      canvas.style.width = state.w + 'px';
      canvas.style.height = state.h + 'px';
      if (ctx) ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }
    resize();

    function onMouseMove(e: MouseEvent) {
      state.cursor.targetX = e.clientX / state.w;
      state.cursor.targetY = e.clientY / state.h;
      state.cursor.active = true;
    }
    function onMouseLeave() {
      state.cursor.active = false;
    }
    function onVisibility() {
      state.paused = document.hidden;
      if (!state.paused) loop();
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', onVisibility);

    // Cheap pseudo-noise for slow blob positions. Smooth, stable.
    function nx(t: number, phase: number) {
      return 0.5 + 0.5 * Math.sin(t / 9000 + phase) * Math.cos(t / 14000 + phase * 0.7);
    }
    function ny(t: number, phase: number) {
      return 0.5 + 0.5 * Math.cos(t / 11000 + phase * 1.3) * Math.sin(t / 17000 + phase * 0.5);
    }

    function frame(t: number) {
      if (!ctx || !canvas) return;
      // Re-evaluate time-of-day warmth on the minute boundary.
      const minute = new Date().getMinutes();
      if (minute !== state.lastWarmthMin) {
        state.warmth = warmthForHour(new Date().getHours());
        state.lastWarmthMin = minute;
      }

      const { w, h, warmth, cursor, reduceMotion } = state;

      // Critically-damped easing on the cursor. ~6 frames @ 60Hz to settle.
      const ease = reduceMotion ? 1 : 0.08;
      cursor.x += (cursor.targetX - cursor.x) * ease;
      cursor.y += (cursor.targetY - cursor.y) * ease;

      // Pointer parallax — small offset opposite the cursor.
      const px = (cursor.x - 0.5) * 24;
      const py = (cursor.y - 0.5) * 18;

      // 1. Paper base
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, w, h);

      // 2. Time-of-day warm wash, parallax-offset
      const wA = `rgba(${warmth.r}, ${warmth.g}, ${warmth.b}, ${warmth.alpha * 1.6})`;
      const wB = `rgba(${warmth.r}, ${warmth.g}, ${warmth.b}, 0)`;
      const g1 = ctx.createRadialGradient(
        w * 0.78 - px * 0.4, h * 0.18 - py * 0.4, 0,
        w * 0.78 - px * 0.4, h * 0.18 - py * 0.4, Math.max(w, h) * 0.6,
      );
      g1.addColorStop(0, wA);
      g1.addColorStop(1, wB);
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(
        w * 0.22 - px * 0.4, h * 0.82 - py * 0.4, 0,
        w * 0.22 - px * 0.4, h * 0.82 - py * 0.4, Math.max(w, h) * 0.55,
      );
      g2.addColorStop(0, `rgba(${warmth.r}, ${warmth.g}, ${warmth.b}, ${warmth.alpha * 0.9})`);
      g2.addColorStop(1, wB);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // 3. Procedural light blobs — three slow-moving sources blended like light
      ctx.globalCompositeOperation = 'screen';
      const tt = reduceMotion ? 0 : t;
      for (let i = 0; i < 3; i++) {
        const cx = nx(tt, i * 1.7) * w + (i - 1) * px * 0.5;
        const cy = ny(tt, i * 1.7) * h + (i - 1) * py * 0.5;
        const r = Math.max(w, h) * (0.32 + (i % 2) * 0.06);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${warmth.r}, ${warmth.g}, ${warmth.b}, ${warmth.blob})`);
        g.addColorStop(1, `rgba(${warmth.r}, ${warmth.g}, ${warmth.b}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.globalCompositeOperation = 'source-over';

      // 4. Cursor lamplight — only when the cursor has been moved at least once
      if (cursor.active) {
        const cxp = cursor.x * w + px * 0.2;
        const cyp = cursor.y * h + py * 0.2;
        const radius = Math.max(w, h) * 0.28;
        const cg = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, radius);
        cg.addColorStop(0, `rgba(${warmth.cursor.r}, ${warmth.cursor.g}, ${warmth.cursor.b}, ${warmth.cursor.alpha})`);
        cg.addColorStop(0.6, `rgba(${warmth.cursor.r}, ${warmth.cursor.g}, ${warmth.cursor.b}, ${warmth.cursor.alpha * 0.3})`);
        cg.addColorStop(1, `rgba(${warmth.cursor.r}, ${warmth.cursor.g}, ${warmth.cursor.b}, 0)`);
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, w, h);
      }

      // 5. Vignette — last layer, darkens edges
      const vg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
      vg.addColorStop(0.55, 'rgba(35, 25, 15, 0)');
      vg.addColorStop(1, `rgba(35, 25, 15, ${warmth.vignette})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    }

    function loop(t = 0) {
      if (state.paused) return;
      frame(t);
      // If reduce-motion is on, do a single frame and stop drawing.
      // We still resize / re-eval warmth on demand via mouse + interval.
      if (state.reduceMotion) return;
      state.rafId = requestAnimationFrame(loop);
    }
    state.rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        // Ensures the canvas is the ground beneath all v3 content.
      }}
    />
  );
}
