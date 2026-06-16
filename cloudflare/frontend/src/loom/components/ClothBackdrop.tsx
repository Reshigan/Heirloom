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
  '/': 'tapestry',             // landing hero — the living woven cloth, full power
  '/loom': 'infinity',         // the threshold ceremony — a centred ∞
  '/loom/pwa': 'tapestry',     // capture home — "the listener asks" rises from the weave
  '/loom/today': 'tapestry',
  // ── content + form rooms all wear the Living Tapestry, so the whole app reads
  // as one woven surface; the type stays hero in the clean upper band. ──
  '/onboarding': 'tapestry',
  '/login': 'tapestry',
  '/signin': 'tapestry',
  '/signup': 'tapestry',
  '/pricing': 'tapestry',
  '/billing': 'tapestry',
  '/compose': 'tapestry',
  '/loom/compose': 'tapestry',
  '/quick': 'tapestry',
  '/loom/index': 'tapestry',
  '/memories': 'tapestry',
  '/threads': 'tapestry',
  '/loom/weft': 'tapestry',
  '/family-feed': 'tapestry',
  '/on-this-day': 'tapestry',
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
  // Unmapped rooms fall to the Living Tapestry (not a flat bloom) so every
  // surface belongs to the same woven cloth.
  return ROUTE_VARIANT[p] ?? 'tapestry';
}

// The data-room gestures (waveform/seal/book) render as recognisable objects, so
// at full luminance they fight the type for the eye. The map + ambient bloom are
// already whisper-quiet and read perfectly; these three get dimmed to match, so
// the gesture stays backdrop and the words stay hero.
const VARIANT_INTENSITY: Partial<Record<FilamentVariant, number>> = {
  waveform: 0.36,
  seal: 0.58,
  book: 0.55,
};

// The Living Tapestry runs at two powers. On the HERO surfaces — landing, the
// capture home, today — the screen is mostly empty negative space, so the weave
// is the showpiece and burns at full 0.9. Every OTHER tapestry room carries real
// text down into the lower viewport (pricing cards, list rows, form fields),
// where the bright foot-convergence would wash the words out. There the weave
// drops to a faint woven ground so the type always wins. (Legibility is
// functionality — never let the backdrop eat a control.)
const TAPESTRY_HERO = new Set(['/', '/loom/pwa', '/loom/today']);
const TAPESTRY_HERO_INTENSITY = 0.9;
const TAPESTRY_CONTENT_INTENSITY = 0.34;

function intensityFor(variant: FilamentVariant, pathname: string): number {
  if (variant === 'tapestry') {
    return TAPESTRY_HERO.has(pathname) ? TAPESTRY_HERO_INTENSITY : TAPESTRY_CONTENT_INTENSITY;
  }
  return VARIANT_INTENSITY[variant] ?? 1;
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
  // Normalise once — both the variant map and the tapestry hero set key on the
  // trailing-slash-stripped, lower-cased path.
  const p = (location.pathname.replace(/\/+$/, '') || '/').toLowerCase();
  const variant = variantFor(location.pathname);
  // Re-key on (variant, path) so navigation re-weaves the gesture fresh.
  return <Filament key={`${variant}:${location.pathname}`} variant={variant} seed={seedFor(location.pathname)} intensity={intensityFor(variant, p)} />;
}
