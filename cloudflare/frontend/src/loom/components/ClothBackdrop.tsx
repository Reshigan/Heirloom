import { useLocation } from 'react-router-dom';
import { Filament, type FilamentVariant } from './Filament';
import WaterCanvas from '../water/WaterCanvas';
import { useLoomTheme } from '../theme';

// Empty back-compat export — ClothShell re-exports this name, but nothing
// consumes the data now that each screen wears its own contained filament
// gesture. Kept empty so the re-export resolves without fabricated entries.
export const CLOTH_BG_ENTRIES: never[] = [];

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
  // ── voice / oral history ──
  // The single record & guided-interview screens are sparse and centred, so
  // they wear the glowing waveform. The /voice INDEX is a dense list (each
  // entry already draws its own waveform as content) — a centred backdrop
  // waveform sat ON the rows, so the list goes top-hung 'arc' instead.
  '/voice': 'arc',
  '/loom/voice': 'arc',
  '/record': 'waveform',
  '/loom/record': 'waveform',
  '/interview': 'waveform',
  '/loom/interview': 'waveform',
  // ── letters / sealed notes / time-capsules ──
  // These are dense list/compose screens; a centred wax-seal ring sat on the
  // letter entries and form fields. They go top-hung 'arc' (collision-free,
  // like the composer). The wax seal lives on as real content (the ∞ WaxSeal
  // at the foot of ledgers), never as a backdrop panel over the type.
  '/letters': 'arc',
  '/loom/letters': 'arc',
  '/letter': 'arc',
  '/compose-letter': 'arc',
  '/loom/compose-letter': 'arc',
  '/sealed': 'arc',
  '/loom/sealed': 'arc',
  '/time-capsules': 'arc',
  '/timecapsules': 'arc',
  '/capsules': 'arc',
  '/loom/capsules': 'arc',
  // ── the book ──
  // The /book showcase wears the luminous bound volume. The /book-builder +
  // /export are dense control screens (step tabs, ledgers, lists) where the
  // centred volume crossed the controls, so they go top-hung 'arc' instead.
  '/book': 'book',
  '/book-builder': 'arc',
  '/loom/book': 'book',
  '/export': 'arc',
  // ── the memory map draws its OWN coordinate field + warm place-points in the
  //    DOM, so it needs no backdrop artwork — the lifted map render even carried
  //    baked-in place labels that collided with the real empty state. These
  //    routes fall through to 'ambient' (a single faint warm bloom).
};

function variantFor(pathname: string): FilamentVariant {
  const p = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  return ROUTE_VARIANT[p] ?? 'ambient';
}

// Two-tier dimming. The ceremonial / showcase screens that HAVE a golive
// reference (landing hero, threshold, home prompt, lineage, wrapped, unseal,
// sign-in) keep their gesture bright — there the filament IS the picture. The
// recognisable-object gestures (waveform/seal/book) read as panels that fight
// the type, so they're dimmed even at variant level. Then a per-route floor
// (ROUTE_INTENSITY) pushes the DENSE content rooms — composer, lists, billing —
// quieter still, so the backdrop recedes behind forms and the words stay hero.
const VARIANT_INTENSITY: Partial<Record<FilamentVariant, number>> = {
  crown: 0.5,
  tree: 0.6,
  ember: 0.55,
  waveform: 0.4,
  seal: 0.42,
  book: 0.4,
};
// Dense content/form routes: the gesture must recede behind the controls. This
// floor is layered OVER the variant default and wins where set, so e.g. the
// composer's `arc` is dimmed here even though `arc` has no variant dimming
// (the ceremonial sign-in, also `arc`, stays bright). Functionality first:
// a backdrop overlapping form fields is a regression — keep it faint.
const ROUTE_INTENSITY: Record<string, number> = {
  '/compose': 0.32,
  '/loom/compose': 0.32,
  '/quick': 0.32,
  '/loom/index': 0.34,
  '/memories': 0.34,
  '/threads': 0.34,
  '/loom/weft': 0.34,
  '/family-feed': 0.34,
  '/on-this-day': 0.34,
  '/pricing': 0.46,
  '/billing': 0.42,
  '/onboarding': 0.5,
  // dense list/compose rooms re-routed off centred gestures onto top-hung
  // 'arc' (see ROUTE_VARIANT) — floor the crescent so it stays faint over the
  // entry subtitles and form fields it now hangs above.
  '/voice': 0.34,
  '/loom/voice': 0.34,
  '/letters': 0.34,
  '/loom/letters': 0.34,
  '/letter': 0.34,
  '/compose-letter': 0.32,
  '/loom/compose-letter': 0.32,
  '/sealed': 0.34,
  '/loom/sealed': 0.34,
  '/time-capsules': 0.34,
  '/timecapsules': 0.34,
  '/capsules': 0.34,
  '/loom/capsules': 0.34,
  '/book-builder': 0.34,
  '/export': 0.34,
};
function intensityFor(pathname: string, variant: FilamentVariant): number {
  const p = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  return ROUTE_INTENSITY[p] ?? VARIANT_INTENSITY[variant] ?? 1;
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
  const { theme } = useLoomTheme();
  const resolvedDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  // The dye-bath ground: in dark theme the whole app floats over one living
  // sheet of family dye diffusing in lit water (mounted once, no key, so it
  // persists unbroken across navigation). Light theme keeps the contained
  // per-route filament gesture — a dark water sheet behind bone pages would
  // wreck light-mode contrast.
  if (resolvedDark) return <WaterCanvas />;

  const variant = variantFor(location.pathname);
  // Re-key on (variant, path) so navigation re-weaves the gesture fresh.
  return <Filament key={`${variant}:${location.pathname}`} variant={variant} seed={seedFor(location.pathname)} intensity={intensityFor(location.pathname, variant)} />;
}
