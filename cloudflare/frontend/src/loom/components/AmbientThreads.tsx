import { useEffect, useRef } from 'react';

/**
 * AmbientThreads — the living cloth.
 *
 * A subtle ambient layer of thread-sparks: short hairline weft/warp segments that
 * fade in with a dye colour, glow at the peak of their life, then dull out and vanish.
 * Always behind content, never interactive. This is the "cloth on every screen"
 * substrate — quiet enough to read over, alive enough to feel woven.
 *
 * Honours prefers-reduced-motion (renders a still scatter, no animation) and pauses
 * when the tab is hidden.
 */

// Natural-dye palette (§2.7) — the only colours allowed to pop.
const DYES = [
  '#e84030', // madder
  '#d42868', // cochineal
  '#f05268', // kermes
  '#f5c832', // saffron
  '#edae2e', // weld
  '#a07040', // walnut
  '#4898d8', // woad
  '#3878e8', // indigo
];
const WARM = '#b07a4a';

interface Spark {
  x: number;
  y: number;
  len: number;
  vertical: boolean;
  color: string;
  glow: boolean;
  born: number;
  life: number; // ms
}

const LIFE_MIN = 1400;
const LIFE_MAX = 2800;

// One curve, used everywhere (matches --ease cubic-bezier(0.16,1,0.3,1) feel).
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export function AmbientThreads({
  density = 1,
  opacity = 1,
}: {
  /** Multiplier on how many sparks live at once. */
  density?: number;
  /** Overall layer opacity. */
  opacity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // Target population scales with viewport area; kept deliberately sparse.
    const target = Math.max(8, Math.round((w * h) / 90000 * density));

    function spawn(now: number): Spark {
      const vertical = Math.random() > 0.45;
      const glow = Math.random() > 0.7; // ~30% get the warm/dye glow pop
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        len: 14 + Math.random() * 46,
        vertical,
        color: glow && Math.random() > 0.5 ? WARM : DYES[(Math.random() * DYES.length) | 0],
        glow,
        born: now,
        life: LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN),
      };
    }

    const sparks: Spark[] = [];
    const t0 = performance.now();
    for (let i = 0; i < target; i++) {
      const s = spawn(t0);
      // Stagger initial lifecycles so they don't all pulse together.
      s.born = t0 - Math.random() * s.life;
      sparks.push(s);
    }

    function drawSpark(s: Spark, now: number) {
      const age = (now - s.born) / s.life; // 0..1
      // Triangular envelope: fade in to peak at mid-life, dull out after.
      const env = age < 0.5 ? easeOutQuint(age / 0.5) : easeOutQuint((1 - age) / 0.5);
      const baseAlpha = s.glow ? 0.5 : 0.28;
      const alpha = Math.max(0, env * baseAlpha);
      if (alpha <= 0.005) return;

      ctx!.globalAlpha = alpha;
      ctx!.strokeStyle = s.color;
      ctx!.lineWidth = 1;
      if (s.glow) {
        ctx!.shadowBlur = 8 * env;
        ctx!.shadowColor = s.color;
      } else {
        ctx!.shadowBlur = 0;
      }
      ctx!.beginPath();
      if (s.vertical) {
        ctx!.moveTo(s.x, s.y);
        ctx!.lineTo(s.x, s.y + s.len);
      } else {
        ctx!.moveTo(s.x, s.y);
        ctx!.lineTo(s.x + s.len, s.y);
      }
      ctx!.stroke();
    }

    let raf = 0;
    let running = true;

    function frame() {
      if (!running) return;
      const now = performance.now();
      ctx!.clearRect(0, 0, w, h);
      ctx!.lineCap = 'butt';
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        if (now - s.born >= s.life) {
          sparks[i] = spawn(now); // respawn elsewhere — threads pop up and disappear
        }
        drawSpark(sparks[i], now);
      }
      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    }

    function drawStill() {
      ctx!.clearRect(0, 0, w, h);
      for (const s of sparks) {
        ctx!.globalAlpha = s.glow ? 0.35 : 0.2;
        ctx!.strokeStyle = s.color;
        ctx!.lineWidth = 1;
        ctx!.shadowBlur = 0;
        ctx!.beginPath();
        if (s.vertical) {
          ctx!.moveTo(s.x, s.y);
          ctx!.lineTo(s.x, s.y + s.len);
        } else {
          ctx!.moveTo(s.x, s.y);
          ctx!.lineTo(s.x + s.len, s.y);
        }
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
    }

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    }

    function onResize() {
      resize();
      if (reduced) drawStill();
    }

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) {
      drawStill();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
        zIndex: 0,
      }}
    />
  );
}
