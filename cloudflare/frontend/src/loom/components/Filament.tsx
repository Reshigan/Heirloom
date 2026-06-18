import { useEffect, useRef, useState } from 'react';

/**
 * Filament — a contained glowing-filament treatment for a single screen.
 *
 * The Cosmic Loom direction (Higgsfield "B") renders the family thread as warm
 * woven light. Rather than approximate those gestures procedurally, this layer
 * ships the *actual artwork* extracted from the golive reference screens
 * (`.higgsfield/golive/today/`): each gesture's warm filament region was lifted
 * out of its reference render, isolated from the bone text + phone bezel by a
 * warm-hue mask, and saved as a black-backed WebP. We composite that artwork
 * onto the ink page with `mix-blend-mode: screen`, so the near-black drops out
 * and only the warm light remains — pixel-for-pixel the reference filament.
 *
 * One gesture per screen, placed in the same zone the reference puts it (a
 * crescent hung from the top of the sign-in, a radiating crown over the home
 * prompt, woven waves across the bottom of the hero, a centred ∞ at the
 * threshold, wing-sprays over the lineage). The layer is purely decorative —
 * `pointer-events: none`, `aria-hidden` — so it never touches functionality.
 *
 * The golive references are all dark-themed, so on the paper/light theme the
 * filament hides (warm-on-black has no honest reading over bone). A subtle
 * opacity breath keeps the light alive; it answers the `heirloom:weave` ritual
 * with a brief brightening, and respects `prefers-reduced-motion`.
 */

export type FilamentVariant =
  | 'arc'       // crescent ring hanging from the top — sign-in, composer, pricing, thread, threshold
  | 'crown'     // radiating aurora crown over the top third — home prompt
  | 'wave'      // horizontal woven waves across the bottom third — landing hero
  | 'infinity'  // a centred ∞ lemniscate knot — the threshold ceremony
  | 'ember'     // ∞ wax knot breaking open into rising embers — a letter unsealed
  | 'scurve'    // one vast faint S-curve behind giant numbers — the year wrapped
  | 'tree'      // two wing-sprays of light rising from the top — the lineage
  | 'waveform'  // a centred glowing audio waveform — voice / record / interview
  | 'book'      // a luminous bound volume floating in warm bloom — the book rooms
  | 'seal'      // a warm wax-seal ring with an ∞ core — letters / sealed notes
  | 'map'       // scattered glowing place-lights over faint latitudes — memory map
  | 'ambient'   // a single faint warm bloom, no strokes — quiet reading/utility rooms
  | 'none';     // pure ink — opt-out only

interface FilamentProps {
  variant?: FilamentVariant;
  /** Vary the woven texture per screen so two arcs don't look identical. (Kept for back-compat.) */
  seed?: number;
  /** 0–1.4 — scales luminance. Rooms can dim their gesture. */
  intensity?: number;
  className?: string;
  style?: React.CSSProperties;
}

type Place = {
  /** WebP filename under /filaments (without extension). */
  src: string;
  /** intrinsic width / height of the artwork — drives the box aspect. */
  ar: number;
  /** base luminance for the gesture (multiplied by `intensity`). */
  opacity: number;
  /** placement of the gesture box inside the full-viewport host. */
  style: React.CSSProperties;
  /** cover gestures fill the whole viewport instead of holding their aspect. */
  cover?: boolean;
  /**
   * Resting luminance gain. CSS `opacity` clamps at 1, so a gesture already at
   * full opacity can't be pushed brighter that way; `mix-blend-mode: screen`
   * means a brighter source reads brighter, so we lift faint top/centre
   * gestures with a `filter: brightness()` to match the golive references.
   */
  boost?: number;
};

// Each gesture sits in the same zone its golive reference puts it. Centred and
// top gestures hold a max width so they read on wide desktops; the hero waves
// and the cover gestures (map, scurve) bleed full width.
const CENTER_TOP = (top: string): React.CSSProperties => ({
  top,
  left: '50%',
  transform: 'translate(-50%, -50%)',
});
const HANG_TOP: React.CSSProperties = { top: 0, left: '50%', transform: 'translateX(-50%)' };

// NOTE on `boost`: `mix-blend-mode: screen` renders every non-black pixel of the
// artwork, and the lossy WebP carries a faint non-zero field around the warm
// strands. `filter: brightness()` MULTIPLIES that field, so a boost >~1.15 lifts
// the field enough that the gesture's rectangular bounding box reads as a visible
// panel sitting on top of the page content. Boosts are kept ≤1.1 for that reason;
// the soft edge-fade mask below (MASK / COVER_MASK) erases the box corners so the
// gesture never reads as a rectangle even where the field survives.
const PLACE: Record<Exclude<FilamentVariant, 'ambient' | 'none'>, Place> = {
  // ── top-hung gestures ──
  arc: { src: 'arc', ar: 1100 / 523, opacity: 1, boost: 1.0, style: { ...HANG_TOP, width: 'clamp(360px, 102vw, 900px)' } },
  crown: { src: 'crown', ar: 848 / 543, opacity: 1, boost: 1.1, style: { ...HANG_TOP, width: 'clamp(360px, 100vw, 880px)' } },
  tree: { src: 'tree', ar: 1100 / 635, opacity: 1, boost: 1.1, style: { top: '1%', left: '50%', transform: 'translateX(-50%)', width: 'clamp(360px, 100vw, 840px)' } },
  // ── bottom gesture ──
  wave: { src: 'wave', ar: 768 / 606, opacity: 1, boost: 1.05, style: { bottom: 0, left: 0, width: '100%' } },
  // ── centred gestures ──
  infinity: { src: 'infinity', ar: 452 / 308, opacity: 1, boost: 1.1, style: { ...CENTER_TOP('40%'), width: 'clamp(220px, 60vw, 400px)' } },
  ember: { src: 'ember', ar: 808 / 867, opacity: 1, boost: 1.1, style: { ...CENTER_TOP('44%'), width: 'clamp(280px, 70vw, 460px)' } },
  waveform: { src: 'waveform', ar: 1100 / 445, opacity: 1, boost: 1.05, style: { ...CENTER_TOP('50%'), width: 'clamp(360px, 94vw, 860px)' } },
  seal: { src: 'seal', ar: 476 / 409, opacity: 1, boost: 1.05, style: { ...CENTER_TOP('50%'), width: 'clamp(180px, 46vw, 300px)' } },
  book: { src: 'book', ar: 323 / 347, opacity: 1, boost: 1.05, style: { ...CENTER_TOP('46%'), width: 'clamp(190px, 48vw, 320px)' } },
  // ── cover gestures (full-viewport, faint) ──
  map: { src: 'map', ar: 653 / 1100, opacity: 0.9, boost: 1.1, cover: true, style: { inset: 0, backgroundSize: 'cover', backgroundPosition: 'center' } },
  scurve: { src: 'scurve', ar: 624 / 1100, opacity: 0.75, boost: 1.05, cover: true, style: { inset: 0, backgroundSize: 'cover', backgroundPosition: 'right center' } },
};

// Edge-fade masks. The artwork's warm light always lives in the centre of its
// box; these radial masks drop the box's alpha to 0 before its rectangular edge,
// so even when the screen-blended field survives there is no visible rectangle —
// the gesture dissolves into the ink instead of sitting on it as a panel.
const MASK = 'radial-gradient(ellipse 72% 70% at 50% 46%, #000 42%, rgba(0,0,0,0.28) 74%, transparent 100%)';
const COVER_MASK = 'radial-gradient(ellipse 96% 86% at 50% 42%, #000 50%, transparent 100%)';

// Inject the breath keyframes once. Subtle: a slow opacity sway on the one
// canonical curve. Gated at the element level by prefers-reduced-motion.
const STYLE_ID = 'filament-breath-kf';
function ensureKeyframes() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = '@keyframes filabreath{from{opacity:var(--fo)}to{opacity:calc(var(--fo) * 0.86)}}';
  document.head.appendChild(s);
}

export function Filament({ variant = 'none', intensity = 1, className, style }: FilamentProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<HTMLDivElement>(null);
  const [paper, setPaper] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Track theme (filaments are dark-only) by watching the nearest .loom root.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const loom = host.closest('.loom') as HTMLElement | null;
    const read = () => setPaper((loom?.getAttribute('data-theme') ?? 'dark') === 'light');
    read();
    if (!loom) return;
    const mo = new MutationObserver(read);
    mo.observe(loom, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [variant]);

  // Respect reduced-motion for the breath.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const read = () => setReduced(mq.matches);
    read();
    mq.addEventListener('change', read);
    return () => mq.removeEventListener('change', read);
  }, []);

  useEffect(() => ensureKeyframes(), []);

  // The weave ritual: brighten the gesture briefly when a memory is woven.
  useEffect(() => {
    const onWeave = () => {
      const g = gestureRef.current;
      if (!g) return;
      g.style.filter = 'brightness(1.85)';
      window.setTimeout(() => {
        if (gestureRef.current) gestureRef.current.style.filter = 'brightness(var(--fb))';
      }, 80);
    };
    window.addEventListener('heirloom:weave', onWeave);
    return () => window.removeEventListener('heirloom:weave', onWeave);
  }, []);

  const place = variant === 'none' || variant === 'ambient' ? null : PLACE[variant];
  const op = Math.max(0, Math.min(1.4, intensity)) * (place?.opacity ?? 1);

  return (
    <div
      ref={hostRef}
      className={className}
      aria-hidden
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style }}
    >
      {/* ambient fallback — a single faint warm bloom, no artwork */}
      {variant === 'ambient' && !paper && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(120% 80% at 50% -10%, rgba(224,160,98,0.10), rgba(224,160,98,0.03) 38%, transparent 64%)',
          }}
        />
      )}

      {place && !paper && (
        <div
          ref={gestureRef}
          style={{
            position: 'absolute',
            backgroundImage: `url(/filaments/${place.src}.webp)`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: place.cover ? undefined : '100% 100%',
            aspectRatio: place.cover ? undefined : `${place.ar}`,
            mixBlendMode: 'screen',
            transition: 'filter 1400ms var(--ease)',
            willChange: 'opacity',
            ['--fo' as string]: String(op),
            ['--fb' as string]: String(place.boost ?? 1),
            filter: 'brightness(var(--fb))',
            opacity: op,
            // Edge-fade so the screen-blended box never reads as a rectangle.
            WebkitMaskImage: place.cover ? COVER_MASK : MASK,
            maskImage: place.cover ? COVER_MASK : MASK,
            animation: reduced ? undefined : 'filabreath 1400ms var(--ease) infinite alternate',
            ...place.style,
          }}
        />
      )}
    </div>
  );
}
