/**
 * CursorLight — a soft warm radial that follows the pointer.
 *
 * The user is "holding a taper" near the fire. Their attention has a
 * physical glow on the canvas. Disabled on touch (no hover) and on
 * prefers-reduced-motion. Uses a fixed-position element with transform
 * driven by RAF-throttled pointermove — no continuous re-render of
 * React tree.
 */

import { useEffect, useRef } from 'react';

export function CursorLight() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';

    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    const apply = () => {
      el.style.transform = `translate3d(${pendingX - 220}px, ${pendingY - 220}px, 0)`;
      raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      el.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      el.style.opacity = '0';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-0 transition-opacity duration-500"
      style={{
        width: 440,
        height: 440,
        background:
          'radial-gradient(circle, rgba(255,168,80,0.16) 0%, rgba(255,140,60,0.08) 30%, transparent 70%)',
        filter: 'blur(28px)',
        willChange: 'transform, opacity',
      }}
    />
  );
}
