import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Dye } from '../dye';
import { dyeVar } from '../dye';

/**
 * The Illuminated Ledger — the canonical page language (Higgsfield concept "B").
 *
 * Every screen reads as a page of the family's ledger: a giant Fraunces
 * headline holds the top, then hairline-ruled entry rows fall beneath it —
 * the entry's title set in serif on the left, its year and the hand that wrote
 * it set in mono on the right, the author tinted by their dye. The gold ∞ rests
 * at the foot of the page. One warm colour, type as the hero, 60–70% air.
 *
 * These five exports are imported across the app, so evolving them upgrades
 * every consuming page at once — there is no parallel component set.
 */

/**
 * The ledger headline — a large, left-set Fraunces display with a mono
 * eyebrow above it. This is the "Start your family's thousand-year thread."
 * treatment from the concept; `align="center"` keeps the ceremony surfaces
 * (onboarding, unlock) centred.
 */
export function CosmicHeader({
  eyebrow,
  title,
  sub,
  align = 'left',
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  align?: 'center' | 'left';
}) {
  // First Light grammar: a plain-string title breathes in two tones — the
  // opening words carry full cream, the rest recede. ReactNode titles pass
  // through untouched so bespoke headers keep their own composition.
  let shown: ReactNode = title;
  if (typeof title === 'string') {
    const w = title.split(' ');
    const cut = Math.min(3, Math.max(1, Math.floor(w.length / 3)));
    shown = (
      <>
        <span className="hl-lit">{w.slice(0, cut).join(' ')}</span>{' '}
        <span style={{ color: 'var(--bone-dim)' }}>{w.slice(cut).join(' ')}</span>
      </>
    );
  }
  return (
    <header style={{ textAlign: align, marginBottom: 48 }}>
      {eyebrow && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 20 }}>
          {eyebrow}
        </div>
      )}
      <h1
        style={{
          fontFamily: 'var(--serif-display)',
          fontSize: 'clamp(36px, 8vw, 58px)',
          lineHeight: 1.08,
          letterSpacing: '-0.014em',
          color: 'var(--bone)',
          margin: 0,
          fontWeight: 340,
          // Width in the h1's own em so it scales with the type — a header-level
          // em constraint computed against 16px and wrapped one word per line.
          maxWidth: align === 'center' ? undefined : '11em',
        }}
      >
        {shown}
      </h1>
      {sub && (
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 17, lineHeight: 1.55, color: 'var(--bone-dim)', margin: '20px 0 0', maxWidth: '30em' }}>
          {sub}
        </p>
      )}
    </header>
  );
}

/**
 * The ledger's only mark beside a name — a square (radius 0) of size px.
 * Copper is signal-only and never filled: with no `color` it renders a 1px
 * copper stroke on a transparent ground. A passed dye is the sanctioned
 * identity colour, so it renders a small filled square (or a 1px stroke of
 * that dye when `filled={false}`).
 */
export function WarmDot({ filled = true, size = 5, color }: { filled?: boolean; size?: number; color?: string }) {
  const c = color ?? 'var(--warm)';
  // Copper (no dye passed) is signal-only: never a fill, always a 1px stroke.
  const isFill = color != null && filled;
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        background: isFill ? c : 'transparent',
        border: isFill ? 'none' : `1px solid ${c}`,
        flex: '0 0 auto',
        display: 'inline-block',
      }}
    />
  );
}

/**
 * A ledger row — the heart of the language. Serif title (and optional italic
 * snippet) on the left; on the right a mono cluster of the entry's year, a
 * dye dot, and the author's name tinted by their dye. Old callers that pass
 * only `meta` still get a clean mono right-column, so every existing page
 * keeps working while it gains the hairline-ledger look.
 */
export function EntryRow({
  title,
  sub,
  meta,
  year,
  author,
  dye,
  italic,
  onClick,
  titleColor = 'var(--bone)',
  titleSize = 19,
  titleFont = 'serif',
  subFont = 'serif',
  subColor = 'var(--bone-dim)',
  subItalic = false,
  dateColor = 'var(--bone-faint)',
  noBorder = false,
  ariaHaspopup,
  ariaCurrent,
  ariaPressed,
}: {
  title: ReactNode;
  sub?: ReactNode;
  meta?: ReactNode;
  year?: ReactNode;
  author?: ReactNode;
  dye?: Dye;
  italic?: boolean;
  /** @deprecated the ledger row carries no left bullet — kept for call-site compat */
  filled?: boolean;
  onClick?: () => void;
  /** Per-screen overrides — defaults reproduce the canonical ledger row. */
  titleColor?: string;
  titleSize?: number;
  titleFont?: 'serif' | 'sans' | 'display';
  subFont?: 'serif' | 'sans';
  subColor?: string;
  subItalic?: boolean;
  dateColor?: string;
  noBorder?: boolean;
  /** When the row's click target opens an overlay, declare it to screen readers
   *  (e.g. "dialog"). Spread onto the interactive <button> only; undefined by
   *  default so every existing caller is unaffected. */
  ariaHaspopup?: ButtonHTMLAttributes<HTMLButtonElement>['aria-haspopup'];
  /** When the row is the currently-selected entry (drives a detail view),
   *  declare it to screen readers. Spread onto the interactive <button> only;
   *  undefined by default so every existing caller is unaffected. */
  ariaCurrent?: boolean;
  /** When the row toggles a binary state (in/out of the book), declare the
   *  pressed state to screen readers. Spread onto the interactive <button> only;
   *  undefined by default so every existing caller is unaffected. */
  ariaPressed?: boolean;
}) {
  const tint = dye ? dyeVar(dye) : 'var(--bone-dim)';
  const hasLedgerMeta = year != null || author != null || dye != null;
  const fontFor = (f: 'serif' | 'sans' | 'display') =>
    f === 'sans' ? 'var(--sans)' : f === 'display' ? 'var(--serif-display)' : 'var(--serif)';

  // Only the whole-row click target is a <button>. When there is no onClick the
  // row is a passive container — render a <div> so callers can place focusable
  // controls in `meta` (e.g. LegacyPlan's weave/remove) without nesting a
  // button inside a button (invalid interactive content + an a11y failure).
  const interactive = !!onClick;
  const containerStyle = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 16,
    width: '100%',
    textAlign: 'left' as const,
    padding: '17px 0',
    background: 'none',
    borderWidth: 0,
    borderBottom: noBorder ? 'none' : '1px solid var(--rule)',
    cursor: interactive ? 'pointer' : 'default',
  };

  const inner = (
    <>
      {/* The mote: an entry is a point of dye-light on the water, not a ruled
          ledger line. The glow leads; the author hangs beneath the title. */}
      {dye && (
        <span aria-hidden style={{
          width: 9, height: 9, borderRadius: '50%', flex: 'none',
          alignSelf: 'flex-start', marginTop: 8,
          background: tint,
          boxShadow: `0 0 14px color-mix(in srgb, ${tint} 55%, transparent)`,
        }} />
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: fontFor(titleFont), fontStyle: italic ? 'italic' : 'normal', fontWeight: 400, fontSize: titleFont === 'display' ? Math.max(titleSize, 24) : titleSize + 1, lineHeight: 1.3, color: titleColor, display: 'block' }}>
          {title}
        </span>
        {sub && <span style={{ fontFamily: fontFor(subFont), fontStyle: subItalic ? 'italic' : 'normal', fontSize: 13.5, color: subColor, display: 'block', marginTop: 5, lineHeight: 1.5 }}>{sub}</span>}
        {author != null && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)', display: 'block', marginTop: 6 }}>
            {author}
          </span>
        )}
      </span>

      {hasLedgerMeta ? (
        year != null && (
          <span style={{ whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.14em', color: dateColor, flex: '0 0 auto' }}>{year}</span>
        )
      ) : (
        meta != null && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: dateColor, whiteSpace: 'nowrap', flex: '0 0 auto' }}>{meta}</span>
        )
      )}
    </>
  );

  return interactive ? (
    <button type="button" onClick={onClick} aria-haspopup={ariaHaspopup} aria-current={ariaCurrent ? 'true' : undefined} aria-pressed={ariaPressed} className="hl-ledger-row" style={containerStyle}>
      {inner}
    </button>
  ) : (
    <div className="hl-ledger-row" style={containerStyle}>
      {inner}
    </div>
  );
}

/** Uppercase mono group label (MEMORIES / LETTERS / VOICES). The design mutes
 *  these dividers to a quiet grey-brown; pass tone="copper" for the rare label
 *  the design keeps in dimmed copper. */
export function SectionLabel({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'copper' }) {
  return <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: tone === 'copper' ? 'var(--copper-label)' : 'var(--muted-4)', margin: '34px 0 8px' }}>{children}</div>;
}

/** A closed ring on the surface — the small water-native "sealed" signal.
 *  Replaces every inline ∞ glyph: the ring is the spot on the water where
 *  something was lowered and the surface closed over it. Drawn in the brand's
 *  brushed hand — an offset-centre band whose stroke swells and tapers. */
export function SurfaceRing({ size = 13 }: { size?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 14 14" width={size} height={size} style={{ flex: 'none', verticalAlign: 'baseline' }}>
      <path fill="var(--warm)" fillOpacity="0.8" fillRule="evenodd" d="
        M7 1.4 a5.6 5.6 0 1 0 0.01 0 Z
        M7.35 2.5 a4.55 4.55 0 1 1 -0.01 0 Z" />
      <circle cx="7" cy="7" r="1.5" fill="var(--warm)" />
    </svg>
  );
}

/** The page-foot mark, water-native: the ripple where something was lowered
 * into the Deep — sounding rings fading outward, one warm point at the centre.
 * Drawn in the brand's brushed hand: each ring is an offset-centre band whose
 * stroke swells and tapers (the offsets alternate, so the rings breathe
 * against each other the way real ripples do). */
// Retired. The concentric-ring foot mark was a leftover from the loom/cloth
// brand; the surface is the Deep (water) now, so the page foot is empty
// negative space. Kept as a no-op so ~90 callers need no edit.
// ponytail: null render kills it everywhere in one place; delete callers if a
// pixel-tight foot sweep is ever wanted.
export function WaxSeal(_props: { size?: number }) {
  return null;
}
