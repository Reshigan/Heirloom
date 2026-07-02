import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../services/api';
import { useTapestryEntries, type CanvasEntry } from '../hooks/useTapestryEntries';
import { useListener } from '../hooks/useListener';
import { ClothShell } from '../loom/components/ClothShell';
import { ProgressHair } from '../loom/components/ProgressHair';
import { HLogo } from '../loom/components/HLogo';
import { PwaMenu } from './PwaHome';
import { PwaWizard, shouldShowWizard } from '../loom/components/PwaWizard';
import { dyeVar, type Dye } from '../loom/dye';

/**
 * THE DESCENT — the home. Not a page over the water: the water itself,
 * descended through. The surface is now (the Listener's question and the
 * drop); scrolling is diving — entries hang at their date-depths as points
 * of dye-light while the living water darkens around you (the shader's
 * u_depth, driven by ClothShell's scroll). A bathymeter of years rides the
 * right edge in place of any archive chrome; the bed holds the oldest entry
 * and the promise. No boxes: verbs are handwriting, dates hang in the margin.
 */

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const mono: React.CSSProperties = {
  fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.22em',
};

interface YearGroup { year: number; entries: CanvasEntry[] }

function groupByYear(entries: CanvasEntry[]): YearGroup[] {
  const map = new Map<number, CanvasEntry[]>();
  for (const e of entries) {
    const y = e.date.getFullYear();
    map.set(y, [...(map.get(y) ?? []), e]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => ({
      year,
      entries: list.sort((a, b) => b.date.getTime() - a.date.getTime()),
    }));
}

function entryHref(e: CanvasEntry): string {
  return e.kind === 'voice' ? `/loom/voice?id=${e.id}`
    : e.kind === 'letter' ? `/loom/letter?id=${e.id}`
    : `/loom/read?entry=${e.id}`;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** One entry hanging in the water: a dye-light, the title, a hanging meta line. */
function Mote({ e, offset }: { e: CanvasEntry; offset: number }) {
  const sealed = !!e.sealed;
  return (
    <Link
      to={entryHref(e)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 16, textDecoration: 'none',
        marginLeft: `${offset}%`, maxWidth: '68%', padding: '10px 0',
      }}
    >
      <span aria-hidden style={{
        width: 10, height: 10, borderRadius: '50%', flex: 'none', marginTop: 7,
        background: sealed ? 'transparent' : dyeVar(e.dye as Dye),
        border: sealed ? '1px solid var(--warm)' : 'none',
        boxShadow: sealed
          ? '0 0 14px rgba(224,160,98,0.35)'
          : `0 0 16px ${'color-mix(in srgb, ' + dyeVar(e.dye as Dye) + ' 55%, transparent)'}`,
      }} />
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{
          fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.35,
          color: sealed ? 'var(--bone-dim)' : 'var(--bone)',
          fontStyle: sealed ? 'italic' : 'normal',
          textShadow: '0 1px 18px rgba(7,13,20,0.7)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {e.title || (e.kind === 'voice' ? 'A voice, kept' : 'An entry')}
        </span>
        <span style={{ ...mono, fontSize: 9.5, color: 'var(--bone-faint)', marginTop: 5 }}>
          {sealed
            ? `sealed · surfaces ${e.sealUntil ? e.sealUntil.getFullYear() : 'on its day'}`
            : `${e.author ? e.author + ' · ' : ''}${MONTHS[e.date.getMonth()]}`}
        </span>
      </span>
    </Link>
  );
}

export function Descent() {
  const navigate = useNavigate();
  const { prompt } = useListener();
  const { entries, isLoading } = useTapestryEntries();
  const [depthLabel, setDepthLabel] = useState('now');
  // First-install ceremony — the wizard rides the home (as it did before the
  // Descent) until it has been seen once.
  const [wizardDone, setWizardDone] = useState(() => !shouldShowWizard());
  const [progress, setProgress] = useState(0);
  const yearRefs = useRef<Record<number, HTMLElement | null>>({});

  const years = useMemo(() => groupByYear(entries), [entries]);
  const firstYear = years.length ? years[years.length - 1].year : new Date().getFullYear();
  const spanYears = new Date().getFullYear() - firstYear + 1;

  // Bathymeter: track the ClothShell scroll container (the one true scroller —
  // it already drives the shader's dive). Marker position + nearest-year label.
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const onScroll = () => {
      const range = main.scrollHeight - main.clientHeight;
      const p = range > 0 ? main.scrollTop / range : 0;
      setProgress(p);
      let label = 'now';
      for (const g of years) {
        const el = yearRefs.current[g.year];
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.6) label = String(g.year);
      }
      if (p > 0.985) label = 'the bed';
      setDepthLabel(label);
    };
    main.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => main.removeEventListener('scroll', onScroll);
  }, [years]);

  if (!getAuthToken()) return <Navigate to="/login" replace />;

  const sinkTo = (year: number | 'surface' | 'bed') => {
    const main = document.getElementById('main-content');
    if (!main) return;
    if (year === 'surface') main.scrollTo({ top: 0, behavior: 'smooth' });
    else if (year === 'bed') main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
    else yearRefs.current[year as number]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Two-tone question: dim the middle clause so the hero breathes (Pure Type).
  const words = prompt.split(' ');
  const cut = Math.min(3, Math.max(1, Math.floor(words.length / 3)));
  const head = words.slice(0, cut).join(' ');
  const rest = words.slice(cut).join(' ');

  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark href="/loom/pwa" />}
      topbarRight={<PwaMenu />}
    >
      {!wizardDone && <PwaWizard onDone={() => setWizardDone(true)} />}

      {/* ── Bathymeter — the years are the navigation ── */}
      <div aria-hidden style={{ position: 'fixed', top: 'var(--topbar-h)', right: 22, bottom: 96, width: 1, background: 'rgba(242,230,208,0.13)', zIndex: 24 }} />
      <nav aria-label="Descend to a year" style={{ position: 'fixed', top: 'var(--topbar-h)', right: 0, bottom: 96, width: 64, zIndex: 25 }}>
        <button type="button" onClick={() => sinkTo('surface')} style={{ ...mono, position: 'absolute', top: '2%', right: 32, fontSize: 9, color: 'var(--bone-faint)', background: 'transparent', border: 0, cursor: 'pointer', padding: 6 }}>now</button>
        {years.map((g, i) => (
          <button key={g.year} type="button" onClick={() => sinkTo(g.year)} style={{
            ...mono, position: 'absolute', right: 32, fontSize: 9, padding: 6,
            top: `${10 + ((i + 1) / (years.length + 1)) * 74}%`,
            color: depthLabel === String(g.year) ? 'var(--warm)' : 'var(--bone-faint)',
            background: 'transparent', border: 0, cursor: 'pointer',
            transition: `color 180ms ${EASE}`,
          }}>{g.year}</button>
        ))}
        <button type="button" onClick={() => sinkTo('bed')} style={{ ...mono, position: 'absolute', bottom: '1%', right: 32, fontSize: 9, color: depthLabel === 'the bed' ? 'var(--warm)' : 'var(--bone-faint)', background: 'transparent', border: 0, cursor: 'pointer', padding: 6 }}>the bed</button>
        {/* the diver — where you are */}
        <span aria-hidden style={{
          position: 'absolute', right: 18, top: `calc(2% + ${progress * 92}%)`,
          width: 9, height: 9, borderRadius: '50%', background: 'var(--warm)',
          boxShadow: '0 0 12px rgba(224,160,98,0.55)',
        }} />
      </nav>

      {/* ── The surface: now ── */}
      <section style={{
        minHeight: 'calc(100svh - var(--topbar-h) - 96px)', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '4vh 9vw 6vh', boxSizing: 'border-box',
      }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.32em', color: 'var(--warm)' }}>the listener asks</div>
        <h1 style={{
          fontFamily: 'var(--serif-display)', fontWeight: 350,
          fontSize: 'clamp(34px, 7.4vw, 60px)', lineHeight: 1.08, letterSpacing: '-0.012em',
          margin: '20px 0 0', maxWidth: '15ch', color: 'var(--bone)',
        }}>
          {head} <span style={{ color: 'var(--bone-dim)' }}>{rest}</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: '5vh', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/record')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 16, background: 'transparent',
            border: 0, padding: '6px 0', cursor: 'pointer', minHeight: 44,
          }}>
            {/* the drop — breathing */}
            <span aria-hidden className="hl-drop-breathe" style={{
              width: 12, height: 12, borderRadius: '50%', background: 'var(--warm)',
            }} />
            <span style={{ fontFamily: 'var(--serif-display)', fontStyle: 'italic', fontWeight: 360, fontSize: 27, color: 'var(--warm)' }}>speak</span>
          </button>
          <button type="button" onClick={() => navigate('/compose')} style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: '6px 0', minHeight: 44,
            fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-faint)',
          }}>
            — or write it down
          </button>
        </div>
        {isLoading && <div style={{ marginTop: '6vh' }}><ProgressHair label="sounding the deep…" width={180} /></div>}
        {!isLoading && entries.length === 0 && (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-dim)', marginTop: '7vh', maxWidth: '34ch' }}>
            The water is clear. Lower the first thing in — it will still be here in a hundred years.
          </p>
        )}
        {!isLoading && entries.length > 0 && (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--bone-faint)', marginTop: '7vh' }}>
            the family's water · descend for what came before
          </p>
        )}
      </section>

      {/* ── The dive: entries at their date-depths ── */}
      {years.map((g, gi) => (
        <section key={g.year} ref={(el) => { yearRefs.current[g.year] = el; }} style={{ position: 'relative', padding: '9vh 9vw 11vh', boxSizing: 'border-box' }}>
          <div aria-hidden style={{
            position: 'absolute', top: 0, left: '6vw', zIndex: 0, pointerEvents: 'none',
            fontFamily: 'var(--serif-display)', fontWeight: 300, fontSize: 'clamp(90px, 24vw, 220px)',
            lineHeight: 1, color: 'rgba(242,230,208,0.05)',
          }}>{g.year}</div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '5vh', paddingTop: 60 }}>
            {g.entries.map((e, i) => (
              <Mote key={e.id ?? `${g.year}-${i}`} e={e} offset={[2, 22, 10, 28, 6, 16][(gi + i) % 6]} />
            ))}
          </div>
        </section>
      ))}

      {/* ── The bed ── */}
      {entries.length > 0 && (
        <section style={{ padding: '16vh 9vw 10vh', boxSizing: 'border-box' }}>
          <svg width="52" height="52" viewBox="0 0 48 48" fill="none" aria-hidden>
            <g stroke="var(--bone)" strokeWidth="1.5">
              <circle cx="24" cy="24" r="7" strokeOpacity="0.7" />
              <circle cx="24" cy="24" r="14" strokeOpacity="0.38" />
              <circle cx="24" cy="24" r="21" strokeOpacity="0.16" />
            </g>
            <circle cx="24" cy="24" r="1.8" fill="var(--warm)" />
          </svg>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.3em', color: 'var(--bone-faint)', marginTop: 24 }}>
            the bed · since {firstYear} · {spanYears} {spanYears === 1 ? 'year' : 'years'} held
          </div>
          <p style={{
            fontFamily: 'var(--serif-display)', fontWeight: 350, fontSize: 'clamp(24px, 4.6vw, 36px)',
            lineHeight: 1.22, margin: '16px 0 0', maxWidth: '22ch', color: 'var(--bone)',
          }}>
            Everything your family has ever lowered in is still here.
          </p>
          <button type="button" onClick={() => sinkTo('surface')} style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: '10px 0', minHeight: 44,
            fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--warm)', marginTop: '4vh',
          }}>
            ↑ rise to the surface
          </button>
        </section>
      )}
    </ClothShell>
  );
}
