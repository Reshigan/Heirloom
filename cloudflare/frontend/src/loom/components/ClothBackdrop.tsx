import { useLocation } from 'react-router-dom';
import { Filament, type FilamentVariant } from './Filament';

// Deterministic background entries — kept for back-compat (ClothShell
// re-exports this). Nothing consumes them now that each screen wears its own
// contained filament gesture, but removing the export would break older
// imports, so it stays.
function sineHash(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const DYE_KEYS = ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'] as const;

export const CLOTH_BG_ENTRIES = Array.from({ length: 48 }, (_, i) => ({
  date: new Date(1952 + Math.floor(sineHash(i * 17 + 1) * 74), 0, 1),
  dye: DYE_KEYS[i % DYE_KEYS.length],
  locked: i % 4 === 0,
}));

/**
 * The golive reference screens (`.higgsfield/golive/today/`) each carry ONE
 * contained filament gesture — a crescent ring over the sign-in, a radiating
 * crown over the home prompt, horizontal waves under the hero, a centred ∞ at
 * the threshold, wing-sprays over the lineage — not a single full-bleed web.
 * This map is the single source of truth for which gesture each route wears.
 * A path with no entry falls to 'ambient' (a single faint warm bloom) so no
 * room ever reads as flat black — only the few opt-out routes below force
 * 'none' (pure ink) where the screen's own content carries all the light.
 */
const ROUTE_VARIANT: Record<string, FilamentVariant> = {
  '/': 'wave',                 // landing hero — woven waves across the bottom
  '/loom': 'infinity',         // the threshold ceremony — a centred ∞
  '/loom/pwa': 'crown',        // capture home — "the listener asks"
  '/loom/today': 'crown',
  '/onboarding': 'arc',
  '/login': 'arc',
  '/signin': 'arc',
  '/signup': 'arc',
  '/pricing': 'arc',
  '/billing': 'arc',
  '/compose': 'arc',
  '/loom/compose': 'arc',
  '/quick': 'arc',
  '/loom/index': 'arc',
  '/memories': 'arc',
  '/threads': 'arc',
  '/loom/weft': 'arc',
  '/family-feed': 'arc',
  '/on-this-day': 'arc',
  '/tree': 'tree',
  '/loom/kin': 'tree',
  '/wrapped': 'scurve',
  '/unseal': 'ember',
  '/loom/unlock': 'ember',     // the unseal ceremony — a wax knot breaking into embers
  '/loom/tied': 'ember',
  // ── voice / oral history — a centred glowing audio waveform ──
  '/voice': 'waveform',
  '/loom/voice': 'waveform',
  '/record': 'waveform',
  '/loom/record': 'waveform',
  '/interview': 'waveform',
  '/loom/interview': 'waveform',
  // ── letters / sealed notes — a warm wax-seal ring with an ∞ core ──
  '/letters': 'seal',
  '/loom/letters': 'seal',
  '/letter': 'seal',
  '/compose-letter': 'seal',
  '/loom/compose-letter': 'seal',
  '/sealed': 'seal',
  '/loom/sealed': 'seal',
  '/time-capsules': 'seal',
  '/timecapsules': 'seal',
  '/capsules': 'seal',
  '/loom/capsules': 'seal',
  // ── the book — a luminous bound volume in warm bloom ──
  '/book': 'book',
  '/book-builder': 'book',
  '/loom/book': 'book',
  '/export': 'book',
  // ── the memory map — scattered glowing place-lights over faint latitudes ──
  '/memory-map': 'map',
  '/map': 'map',
  '/loom/map': 'map',
};

function variantFor(pathname: string): FilamentVariant {
  const p = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  return ROUTE_VARIANT[p] ?? 'ambient';
}

// A small stable hash so two `arc` screens don't weave an identical crescent.
function seedFor(pathname: string): number {
  let h = 2166136261;
  for (let i = 0; i < pathname.length; i++) {
    h ^= pathname.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000;
}

interface ClothBackdropProps {
  /** Deprecated — kept for back-compat with older call sites. */
  opacity?: number;
  threadOpacity?: number;
  entries?: unknown[];
}

/**
 * ClothBackdrop — the global ambient layer. It no longer hangs one woven web
 * behind everything; it reads the route and renders that screen's single
 * contained filament gesture, so each surface matches its golive reference and
 * the rest of the view stays clean ink with vast negative space.
 */
export function ClothBackdrop(_props: ClothBackdropProps) {
  const location = useLocation();
  const variant = variantFor(location.pathname);
  // Re-key on (variant, path) so navigation re-weaves the gesture fresh.
  return <Filament key={`${variant}:${location.pathname}`} variant={variant} seed={seedFor(location.pathname)} />;
}
