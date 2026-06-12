import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClothWeave, type ClothWhisperEntry, type ClothSealRef } from './ClothWeave';
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

// On these routes the cloth IS the screen — full presence, touchable.
// Everywhere else it recedes behind a veil so the room's work is legible.
const HOME_ROUTES = new Set(['/loom', '/loom/pwa', '/loom/today', '/loom/weft']);

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
  const isHome = HOME_ROUTES.has(location.pathname.replace(/\/$/, '') || '/');

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
          opacity: isHome ? 1 : 0.34,
          transition: 'opacity 1400ms var(--ease-out)',
        }}
      >
        <ClothWeave
          entries={whispers}
          seals={seals}
          interactive={isHome}
          onNavigate={navigate}
        />
      </div>
      {/* The veil — in the rooms the cloth recedes so the page's work is the
          focus; the weave stays present near the centre and settles into ink
          at the edges. Never on home: there the cloth is the screen. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: isHome ? 0 : 0.93,
          transition: 'opacity 1400ms var(--ease-out)',
          background: 'radial-gradient(ellipse 90% 70% at 50% 42%, transparent 16%, var(--ink) 80%)',
        }}
      />
    </>
  );
}
