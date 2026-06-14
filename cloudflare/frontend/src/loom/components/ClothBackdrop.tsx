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

// On these routes the cloth IS the screen — full presence, touchable, no
// reading column to protect. Everywhere else (incl. /loom/today and /loom/weft,
// which carry prose + actions) the cloth recedes behind a veil so the room's
// work stays legible — type is the hero, the weave breathes at the margins.
const HOME_ROUTES = new Set(['/loom', '/loom/pwa']);

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

  const present = isHome || surging;

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
          opacity: present ? 1 : 0.26,
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
      {/* The veil — in the rooms the cloth recedes so the page's work is the
          focus. The reading column sits in calm ink at the centre; the weave
          survives only at the far margins and corners, a faint warm web behind
          the negative space. Never on home: there the cloth is the screen. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: present ? 0 : 0.97,
          transition: 'opacity 1400ms var(--ease-out)',
          background:
            'radial-gradient(ellipse 76% 88% at 50% 46%, var(--ink) 38%, color-mix(in srgb, var(--ink) 55%, transparent) 68%, transparent 92%)',
        }}
      />
    </>
  );
}
