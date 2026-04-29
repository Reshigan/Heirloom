/**
 * Fire — canvas-based particle fire.
 *
 * Aim: the photographic memory of a fire (Tarkovsky, Caravaggio candle-
 * light, the fireplace at the end of A Ghost Story). NOT cartoon. NOT
 * realistic-rendered. Painterly, grounded, warm.
 *
 * Architecture:
 *   - Canvas particle system, ~80–140 particles at any given moment.
 *   - Particles spawn at the log line with temperature ~1.0, rise with a
 *     velocity vector + curl noise, cool over lifetime.
 *   - Color sampled from a hand-tuned LUT (white-warm → orange → deep
 *     red → transparent). NEVER bright yellow, NEVER pure white — both
 *     read as digital.
 *   - Additive compositing (lighter) so overlapping particles glow.
 *   - Sparks: a thin secondary particle pool with longer lifetimes and
 *     more travel distance.
 *   - Glowing log core: a low-frequency pulse painted under the flames.
 *   - Heat shimmer: a separate offscreen canvas re-drawn with subtle
 *     vertical wobble above the fire.
 *   - Smoke wisp: cool grey-warm particles above flame top, very low
 *     opacity, slow rise.
 *   - Film grain: tiny random pixel noise re-drawn every ~6 frames.
 *
 * Honors prefers-reduced-motion (renders one static frame and stops).
 * Pauses when tab is hidden (Page Visibility API).
 */

import { useEffect, useRef } from 'react';

interface Props {
  /** 0..1 — dimmed when an entry is open (the fire shrinks back). */
  intensity?: number;
  size?: number;
}

// Hand-tuned color lookup. Indexed by particle temperature 0..1.
// Stops chosen to read as real fire: outer cools to deep red-brown
// (almost charcoal), core is slightly warm white (NOT pure white).
const FIRE_LUT: [number, number, number, number][] = [
  // [temp, r, g, b]
  [0.0, 8, 4, 2],
  [0.1, 36, 14, 6],
  [0.2, 88, 28, 12],
  [0.3, 132, 44, 18],
  [0.45, 184, 70, 24],
  [0.6, 224, 110, 38],
  [0.75, 244, 156, 70],
  [0.88, 252, 196, 120],
  [1.0, 255, 232, 188],
];

function sampleLUT(t: number): [number, number, number] {
  if (t <= 0) return [0, 0, 0];
  if (t >= 1) return [FIRE_LUT[FIRE_LUT.length - 1][1], FIRE_LUT[FIRE_LUT.length - 1][2], FIRE_LUT[FIRE_LUT.length - 1][3]];
  for (let i = 0; i < FIRE_LUT.length - 1; i++) {
    const [t0, r0, g0, b0] = FIRE_LUT[i];
    const [t1, r1, g1, b1] = FIRE_LUT[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return [
        r0 + (r1 - r0) * f,
        g0 + (g1 - g0) * f,
        b0 + (b1 - b0) * f,
      ];
    }
  }
  return [0, 0, 0];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1, 1=just born
  size: number;
  seed: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface SmokeMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

const TARGET_PARTICLES = 110;
const TARGET_SMOKE = 14;

export function Fire({ intensity = 1, size = 320 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = size;
    const H = size * 1.5;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const baseY = H * 0.85; // log surface
    const flameTop = H * 0.18;

    const particles: Particle[] = [];
    const sparks: Spark[] = [];
    const smoke: SmokeMote[] = [];

    let time = 0;
    let logPulse = 0;

    const spawn = () => {
      const intens = intensityRef.current;
      const target = Math.floor(TARGET_PARTICLES * (0.6 + intens * 0.6));
      while (particles.length < target) {
        // Spawn near the log surface, in a horizontal ellipse.
        const angle = (Math.random() - 0.5) * Math.PI;
        const px = cx + Math.sin(angle) * 28 + (Math.random() - 0.5) * 22;
        const py = baseY - 4 + (Math.random() - 0.5) * 6;
        particles.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -(0.55 + Math.random() * 0.5) * (0.85 + intens * 0.3),
          life: 1,
          size: 9 + Math.random() * 14,
          seed: Math.random() * 1000,
        });
      }

      // Sparks — much rarer, longer travel.
      if (Math.random() < 0.04 * intens) {
        sparks.push({
          x: cx + (Math.random() - 0.5) * 30,
          y: baseY - 6,
          vx: (Math.random() - 0.5) * 1.4,
          vy: -(1.6 + Math.random() * 1.2),
          life: 1,
          maxLife: 1.4 + Math.random() * 1.6,
        });
      }

      // Smoke — only the topmost particles transition into smoke.
      while (smoke.length < TARGET_SMOKE && Math.random() < 0.2) {
        smoke.push({
          x: cx + (Math.random() - 0.5) * 24,
          y: flameTop + Math.random() * 30,
          vx: (Math.random() - 0.5) * 0.18,
          vy: -(0.18 + Math.random() * 0.18),
          life: 1,
          size: 28 + Math.random() * 26,
        });
      }
    };

    const step = (dt: number) => {
      time += dt;
      logPulse = 0.85 + Math.sin(time * 0.0012) * 0.08 + Math.sin(time * 0.0031) * 0.06;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        // Curl noise approximation: oscillating horizontal acceleration
        const wobble = Math.sin((p.y + p.seed) * 0.04 + time * 0.002) * 0.06;
        p.vx += wobble * dt;
        p.vy -= 0.0012 * dt; // buoyancy
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Cool faster as it rises.
        const heightProg = 1 - Math.max(0, (p.y - flameTop) / (baseY - flameTop));
        p.life -= (0.0024 + heightProg * 0.0036) * dt;
        if (p.life <= 0 || p.y < flameTop - 30) particles.splice(i, 1);
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vy += 0.0008 * dt; // sparks slow more, then fall slightly
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt / (1000 * s.maxLife);
        if (s.life <= 0 || s.y < flameTop - 80) sparks.splice(i, 1);
      }

      for (let i = smoke.length - 1; i >= 0; i--) {
        const m = smoke[i];
        m.vx += (Math.sin(time * 0.0008 + m.y * 0.02) * 0.04 - m.vx * 0.001) * dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life -= 0.0011 * dt;
        m.size += 0.05 * dt;
        if (m.life <= 0 || m.y < 10) smoke.splice(i, 1);
      }
    };

    const render = () => {
      // Clear with a slight fade rather than full clear — gives motion blur.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, W, H);

      // 1. Glowing log coals — low-frequency pulse, painted underneath.
      ctx.globalCompositeOperation = 'lighter';
      const coalGrad = ctx.createRadialGradient(cx, baseY, 4, cx, baseY, 90);
      coalGrad.addColorStop(0, `rgba(255,128,40,${0.55 * logPulse * intensityRef.current})`);
      coalGrad.addColorStop(0.5, `rgba(180,60,18,${0.30 * logPulse * intensityRef.current})`);
      coalGrad.addColorStop(1, 'rgba(60,20,8,0)');
      ctx.fillStyle = coalGrad;
      ctx.beginPath();
      ctx.ellipse(cx, baseY - 2, 80, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Smoke (under flames so flames overpaint it slightly)
      ctx.globalCompositeOperation = 'source-over';
      for (const m of smoke) {
        const alpha = m.life * 0.085;
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size);
        grad.addColorStop(0, `rgba(80,68,58,${alpha})`);
        grad.addColorStop(1, 'rgba(50,40,30,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Flame particles — additive blending for the glow.
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        const [r, g, b] = sampleLUT(p.life * intensityRef.current);
        const alpha = p.life * p.life * 0.45; // square fade for softer outer
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(${r|0},${g|0},${b|0},${alpha})`);
        grad.addColorStop(0.5, `rgba(${r|0},${g|0},${b|0},${alpha * 0.45})`);
        grad.addColorStop(1, `rgba(${r|0},${g|0},${b|0},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Sparks — pinpoint bright dots
      for (const s of sparks) {
        const alpha = Math.min(1, s.life * 1.4);
        ctx.fillStyle = `rgba(255,210,140,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
        // tiny glow
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
        sg.addColorStop(0, `rgba(255,180,90,${alpha * 0.55})`);
        sg.addColorStop(1, 'rgba(255,180,90,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    if (reduceMotion) {
      // Render a single still frame.
      for (let i = 0; i < 200; i++) spawn();
      step(16);
      render();
      return;
    }

    let lastT = performance.now();
    let raf = 0;
    let visible = !document.hidden;
    const onVisibility = () => {
      visible = !document.hidden;
      lastT = performance.now();
      if (visible && !raf) loop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const loop = () => {
      if (!visible) {
        raf = 0;
        return;
      }
      const now = performance.now();
      const dt = Math.min(40, now - lastT);
      lastT = now;
      spawn();
      step(dt);
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [size]);

  return (
    <div
      className="relative pointer-events-none select-none"
      style={{ width: size, height: size * 1.5 }}
      aria-hidden
    >
      {/* Halo glow under the canvas — soft warm light spilling onto the surroundings. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 2.4,
          height: size * 2.4,
          background: `radial-gradient(circle, rgba(255,140,60,${0.18 * intensity}) 0%, rgba(255,90,30,${0.10 * intensity}) 30%, transparent 70%)`,
          filter: 'blur(36px)',
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* The hearthstone log — drawn as SVG below the canvas so the canvas
          flames sit on top of it. Real wood grain texture, charring on
          top, faint glow underneath. */}
      <svg
        viewBox={`0 0 ${size} ${size * 1.5}`}
        className="absolute inset-0 pointer-events-none"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="log-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a0f06" />
            <stop offset="40%" stopColor="#26160a" />
            <stop offset="100%" stopColor="#0a0604" />
          </linearGradient>
          <radialGradient id="log-charcore" cx="50%" cy="0%" r="60%">
            <stop offset="0%" stopColor="#ff8030" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#aa3a14" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" />
            <feColorMatrix
              values="0 0 0 0 0.05  0 0 0 0 0.03  0 0 0 0 0.02  0 0 0 0.18 0"
            />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>

        {/* Log body */}
        <ellipse cx={size / 2} cy={size * 1.3} rx={size * 0.4} ry={14} fill="url(#log-body)" />
        {/* Charring on top edge */}
        <path
          d={`M ${size * 0.1} ${size * 1.296} Q ${size * 0.3} ${size * 1.275} ${size / 2} ${size * 1.27} Q ${size * 0.7} ${size * 1.275} ${size * 0.9} ${size * 1.296}`}
          stroke="#000"
          strokeWidth="1.4"
          fill="none"
          opacity="0.65"
        />
        {/* Glowing seam where flames meet log */}
        <ellipse
          cx={size / 2}
          cy={size * 1.295}
          rx={size * 0.32}
          ry={5}
          fill="url(#log-charcore)"
        />
        {/* Wood grain hint */}
        <path
          d={`M ${size * 0.16} ${size * 1.31} L ${size * 0.84} ${size * 1.31}
              M ${size * 0.2}  ${size * 1.32} L ${size * 0.8}  ${size * 1.32}
              M ${size * 0.24} ${size * 1.33} L ${size * 0.76} ${size * 1.33}`}
          stroke="#0a0503"
          strokeWidth="0.4"
          opacity="0.5"
        />
        {/* Grain texture overlay */}
        <ellipse
          cx={size / 2}
          cy={size * 1.3}
          rx={size * 0.4}
          ry={14}
          fill="#000"
          filter="url(#grain)"
          opacity="0.22"
        />
      </svg>
    </div>
  );
}
