import { useEffect, useRef, useState } from 'react';

/**
 * Filament — the global ambient backdrop (rendered via ClothBackdrop).
 *
 * HISTORY / WHY THIS IS QUIET NOW.
 * The original Cosmic Loom direction shipped the *actual warm artwork* lifted
 * from the golive reference renders and composited it with `mix-blend-mode:
 * screen` so the near-black dropped out and only the warm light remained. That
 * read as a viewport-scale COPPER AURORA — a crown bloom over the top third, a
 * full-width bottom wave, centred ∞/ember/seal/book blooms — copper as
 * aura/glow/bloom across a large fraction of the surface.
 *
 * ART_DIRECTION Rule 2 forbids that: copper (var(--warm)) is SIGNAL ONLY, kept
 * under ~3% of surface and never used as a fill/glow/aura/bloom. So the warm
 * screen-blended artwork is gone. What remains is a token-built woven GROUND:
 *
 *   • a per-variant ambient wash in ink/bone tones at very low alpha — it sits
 *     in the same zone the old gesture occupied (crown over the top, wave along
 *     the bottom, centred for the knot/seal/book, etc.) so the composition's
 *     spatial soul survives, but it reads as a faint quiet weave, NOT a light
 *     source. Built from var(--ink)/var(--bone-faint), so it theme-flips.
 *   • a single fine bone hairline per gesture (≤1px, var(--bone-faint)) — the
 *     one literal "thread", the woven mark, never copper.
 *
 * No copper anywhere: no warm fill, no warm glow, no screen-blended warm WebP.
 * If a warm accent ever returns it must be a tiny contained gesture (a few px,
 * a ≤1px stroke), never a viewport-scale bloom.
 *
 * The layer is purely decorative — `pointer-events: none`, `aria-hidden` — so
 * it never touches functionality. A subtle opacity breath keeps it alive, it
 * answers the `heirloom:weave` ritual with a brief brightening, and it respects
 * `prefers-reduced-motion`. Because the ground is token-built it reads honestly
 * on BOTH the ink (dark) and paper (light) themes.
 */

export type FilamentVariant =
  | 'arc'       // crescent hung from the top — sign-in, composer, pricing, thread, threshold
  | 'crown'     // a faint woven crown over the top third — home prompt
  | 'wave'      // a horizontal woven band along the bottom third — landing hero
  | 'infinity'  // a centred ∞ lemniscate knot — the threshold ceremony
  | 'ember'     // a centred knot — a letter unsealed
  | 'scurve'    // one vast faint S-curve behind giant numbers — the year wrapped
  | 'tree'      // two faint sprays rising from the top — the lineage
  | 'waveform'  // a centred low band — voice / record / interview
  | 'book'      // a centred quiet bloom — the book rooms
  | 'seal'      // a centred ∞-cored mark — letters / sealed notes
  | 'map'       // a faint scattered ground — memory map
  | 'ambient'   // a single faint bloom, no strokes — quiet reading/utility rooms
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
  /** placement of the ambient zone inside the full-viewport host. */
  style: React.CSSProperties;
  /**
   * base luminance for the gesture's ambient wash (multiplied by `intensity`).
   * Kept deliberately low — this is a quiet ground, not a light source.
   */
  opacity: number;
  /**
   * The woven hairline drawn through the zone. `none` for cover/diffuse zones
   * that read as a field rather than a single thread.
   */
  thread?: 'h' | 'v' | 'cross' | 'none';
};

// Placement helpers — each zone sits where its old gesture lived, so the
// composition keeps its spatial memory while shedding the copper light.
const CENTER = (top: string): React.CSSProperties => ({
  top,
  left: '50%',
  transform: 'translate(-50%, -50%)',
});
const TOP_BAND: React.CSSProperties = { top: 0, left: '50%', transform: 'translateX(-50%)' };

// A wash painted in INK/BONE tokens only — no warm. Very low alpha so it reads
// as a breath of woven ground, never as an aurora. `--fo` carries the live
// opacity (intensity × base) so the breath/weave ritual can modulate it.
const INK_WASH =
  'radial-gradient(ellipse 70% 64% at 50% 46%, rgba(242,230,208,0.05), transparent 72%)';
const COVER_WASH =
  'radial-gradient(ellipse 96% 86% at 50% 42%, rgba(242,230,208,0.035), transparent 80%)';

const PLACE: Record<Exclude<FilamentVariant, 'none'>, Place> = {
  // ── top-hung zones ──
  arc: { style: { ...TOP_BAND, top: 0, width: 'clamp(360px, 100vw, 900px)', height: '40vh' }, opacity: 0.7, thread: 'h' },
  crown: { style: { ...TOP_BAND, top: 0, width: 'clamp(360px, 100vw, 880px)', height: '38vh' }, opacity: 0.7, thread: 'h' },
  tree: { style: { ...TOP_BAND, top: '1%', width: 'clamp(360px, 100vw, 840px)', height: '42vh' }, opacity: 0.7, thread: 'cross' },
  // ── bottom zone ──
  wave: { style: { bottom: 0, left: 0, width: '100%', height: '34vh' }, opacity: 0.65, thread: 'h' },
  // ── centred zones ──
  infinity: { style: { ...CENTER('40%'), width: 'clamp(220px, 60vw, 400px)', height: '34vh' }, opacity: 0.7, thread: 'cross' },
  ember: { style: { ...CENTER('44%'), width: 'clamp(280px, 70vw, 460px)', height: '40vh' }, opacity: 0.7, thread: 'cross' },
  waveform: { style: { ...CENTER('50%'), width: 'clamp(360px, 94vw, 860px)', height: '26vh' }, opacity: 0.6, thread: 'h' },
  seal: { style: { ...CENTER('50%'), width: 'clamp(180px, 46vw, 300px)', height: '30vh' }, opacity: 0.7, thread: 'cross' },
  book: { style: { ...CENTER('46%'), width: 'clamp(190px, 48vw, 320px)', height: '34vh' }, opacity: 0.65, thread: 'v' },
  // ── diffuse cover zones (full-viewport, faintest) ──
  map: { style: { inset: 0 }, opacity: 0.55, thread: 'none' },
  scurve: { style: { inset: 0 }, opacity: 0.5, thread: 'none' },
  // ── bare quiet bloom ──
  ambient: { style: { ...CENTER('50%'), width: 'clamp(280px, 64vw, 640px)', height: '40vh' }, opacity: 0.55, thread: 'none' },
};

// Edge-fade mask so the zone dissolves into the ground instead of reading as a
// rectangle even where the wash survives.
const MASK = 'radial-gradient(ellipse 80% 76% at 50% 46%, #000 46%, transparent 100%)';
const COVER_MASK = 'radial-gradient(ellipse 98% 90% at 50% 42%, #000 56%, transparent 100%)';

// Inject the breath keyframes once. Subtle: a slow opacity sway on the one
// canonical curve. Gated at the element level by prefers-reduced-motion.
const STYLE_ID = 'filament-breath-kf';
function ensureKeyframes() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = '@keyframes filabreath{from{opacity:var(--fo)}to{opacity:calc(var(--fo) * 0.78)}}';
  document.head.appendChild(s);
}

// The woven hairline(s) for a zone — a single ≤1px bone thread, never copper.
// Returns the linear-gradient layers that draw the thread(s) inside the zone.
function threadLayers(kind: NonNullable<Place['thread']>): string[] {
  if (kind === 'none') return [];
  const H = 'linear-gradient(to right, transparent, var(--bone-faint) 22%, var(--bone-faint) 78%, transparent)';
  const V = 'linear-gradient(to bottom, transparent, var(--bone-faint) 22%, var(--bone-faint) 78%, transparent)';
  if (kind === 'h') return [H];
  if (kind === 'v') return [V];
  return [H, V]; // cross
}

export function Filament({ variant = 'none', intensity = 1, className, style }: FilamentProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

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

  // The weave ritual: brighten the ground briefly when a memory is woven.
  // A modest lift only — never a copper flash.
  useEffect(() => {
    const onWeave = () => {
      const g = gestureRef.current;
      if (!g) return;
      g.style.filter = 'brightness(1.5)';
      window.setTimeout(() => {
        if (gestureRef.current) gestureRef.current.style.filter = 'none';
      }, 80);
    };
    window.addEventListener('heirloom:weave', onWeave);
    return () => window.removeEventListener('heirloom:weave', onWeave);
  }, []);

  const place = variant === 'none' ? null : PLACE[variant];
  // The whole ground is intentionally faint — clamp the live opacity well below
  // 1 so even at full intensity it reads as a quiet weave, not a light source.
  const op = place ? Math.max(0, Math.min(0.85, intensity * place.opacity)) : 0;
  const cover = variant === 'map' || variant === 'scurve';
  const threads = place ? threadLayers(place.thread ?? 'none') : [];

  return (
    <div
      ref={hostRef}
      className={className}
      aria-hidden
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style }}
    >
      {place && (
        <div
          ref={gestureRef}
          style={{
            position: 'absolute',
            // The woven ground: faint ink/bone wash + (optionally) one fine
            // bone hairline. No warm anywhere; all colour rides tokens that
            // remap in the light scope, so it theme-flips honestly.
            backgroundImage: [...threads, cover ? COVER_WASH : INK_WASH].join(', '),
            backgroundRepeat: 'no-repeat',
            // hairline(s) ~1px centred; the wash fills the box.
            backgroundSize: threads.length
              ? [
                  ...threads.map((_, i) => (place.thread === 'cross' ? (i === 0 ? '100% 1px' : '1px 100%') : place.thread === 'v' ? '1px 100%' : '100% 1px')),
                  '100% 100%',
                ].join(', ')
              : '100% 100%',
            backgroundPosition: threads.length
              ? [...threads.map(() => 'center'), 'center'].join(', ')
              : 'center',
            transition: 'filter 1400ms var(--ease)',
            willChange: 'opacity',
            ['--fo' as string]: String(op),
            opacity: op,
            // Edge-fade so the box never reads as a rectangle.
            WebkitMaskImage: cover ? COVER_MASK : MASK,
            maskImage: cover ? COVER_MASK : MASK,
            animation: reduced ? undefined : 'filabreath 1400ms var(--ease) infinite alternate',
            ...place.style,
          }}
        />
      )}
    </div>
  );
}
