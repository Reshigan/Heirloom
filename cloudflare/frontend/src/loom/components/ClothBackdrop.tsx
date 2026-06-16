import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type ClothWhisperEntry, type ClothSealRef } from './ClothWeave';
import { CosmicLoom } from './CosmicLoom';
import { useTapestryEntries } from '../../hooks/useTapestryEntries';
import type { Dye } from '../dye';

// Deterministic background entries — kept for back-compat (ClothShell
// re-exports this). The woven cloth itself no longer consumes them; it
// weaves from the family's real entries, or a deterministic palette when
// the thread is still empty.
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

type VeilMode = 'full' | 'band' | 'room';

// `/loom` — the cloth IS the screen, full presence, no veil.
// `/loom/pwa` — capture home: cloth lives in a touchable top band, ink below.
// everything else — the room veil draws over so the page's work stays legible.
function veilModeFor(pathname: string): VeilMode {
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/loom') return 'full';
  if (p === '/loom/pwa') return 'band';
  return 'room';
}

interface ClothBackdropProps {
  /** Deprecated — the woven cloth manages its own presence. Accepted for back-compat. */
  opacity?: number;
  /** Deprecated — ambient spark layer was retired with the woven cloth. */
  threadOpacity?: number;
  /** Deprecated — entries now come from the family's real thread. */
  entries?: unknown[];
}

/**
 * ClothBackdrop — the universal cloth substrate.
 *
 * One woven canvas (ClothWeave) behind all content. On home surfaces the
 * cloth is the screen: full presence, and it answers touch — hover a thread
 * and the cloth remembers whose day it was; a sealed letter glows and says
 * when it opens; the bare warp above the fell says those days belong to
 * those still to come. In every room, a veil draws over the cloth so the
 * work at hand stays legible while the weave breathes at the edges.
 */
export function ClothBackdrop(_props: ClothBackdropProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { entries } = useTapestryEntries();
  const veilMode = veilModeFor(location.pathname);
  const isHome = veilMode !== 'room';

  // The ceremony surge — when an entry is woven anywhere (the save celebration,
  // a letter unlocked), the cloth answers: the veil lifts and the weave comes to
  // full presence so the shuttle's new filament is *seen* streaking across it.
  // It settles back the moment the ritual ends. Without this the rooms' veil
  // would smother the one motion the product earns.
  const [surging, setSurging] = useState(false);
  useEffect(() => {
    let t: number;
    const onWeave = () => {
      setSurging(true);
      window.clearTimeout(t);
      // 1400ms ritual + a held breath, then settle on the canonical curve.
      t = window.setTimeout(() => setSurging(false), 2200);
    };
    window.addEventListener('heirloom:weave', onWeave);
    return () => { window.removeEventListener('heirloom:weave', onWeave); window.clearTimeout(t); };
  }, []);

  // Cloth comes to full presence on a home surface or during the weave ceremony.
  const present = isHome || surging;
  // During a surge the veil always lifts; otherwise it follows the route mode.
  const effectiveMode: VeilMode = surging ? 'full' : veilMode;

  const { whispers, seals } = useMemo(() => {
    const whispers: ClothWhisperEntry[] = [];
    const seals: ClothSealRef[] = [];
    for (const e of entries) {
      if (e.sealUntil) {
        seals.push({ year: e.sealUntil.getFullYear(), route: '/loom/tied' });
        continue;
      }
      if (!e.title) continue;
      whispers.push({
        title: e.title,
        year: e.date.getFullYear(),
        dye: e.dye as Dye,
        route: '/loom/weft',
      });
    }
    return { whispers, seals };
  }, [entries]);

  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          // Off-home the weave used to drop to 0.26 — so faint the signature
          // warm glow vanished in every room. Hold it bright; the room veil
          // (below) keeps centre type legible while the weave breathes.
          opacity: present ? 1 : 0.62,
          transition: 'opacity 1400ms var(--ease-out)',
        }}
      >
        <CosmicLoom
          entries={whispers}
          seals={seals}
          interactive={isHome}
          onNavigate={navigate}
        />
      </div>
      {/* The veil. `full` → none. `room` → radial ink, the page floats in calm
          centre dark. `band` → vertical: cloth reads in the top band, solid ink
          below so the capture block is legible while the cloth stays touchable. */}
      {effectiveMode === 'room' && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            // Was 0.97 + a wide ink core that blacked the whole room. Lighter
            // now, with a smaller core, so the warm weave glows at the top and
            // edges (matching the mockups) while the centred text stays calm.
            opacity: 0.82,
            transition: 'opacity 1400ms var(--ease-out)',
            background:
              'radial-gradient(ellipse 70% 80% at 50% 44%, var(--ink) 28%, color-mix(in srgb, var(--ink) 46%, transparent) 62%, transparent 90%)',
          }}
        />
      )}
      {effectiveMode === 'band' && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            transition: 'opacity 1400ms var(--ease-out)',
            background:
              'linear-gradient(to bottom, transparent 0%, transparent 30%, color-mix(in srgb, var(--ink) 72%, transparent) 44%, var(--ink) 60%, var(--ink) 100%)',
          }}
        />
      )}
    </>
  );
}
