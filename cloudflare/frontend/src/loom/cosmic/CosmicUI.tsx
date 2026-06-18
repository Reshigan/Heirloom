import type { ReactNode } from 'react';
import type { Dye } from '../dye';
import { dyeVar } from '../dye';

/**
 * The Illuminated Ledger — the canonical page language (Higgsfield concept "B").
 *
 * Every screen reads as a page of the family's ledger: a giant Cormorant
 * headline holds the top, then hairline-ruled entry rows fall beneath it —
 * the entry's title set in serif on the left, its year and the hand that wrote
 * it set in mono on the right, the author tinted by their dye. The gold ∞ rests
 * at the foot of the page. One warm colour, type as the hero, 60–70% air.
 *
 * These five exports are imported across the app, so evolving them upgrades
 * every consuming page at once — there is no parallel component set.
 */

/**
 * The ledger headline — a large, left-set Cormorant display with a mono
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
  return (
    <header style={{ textAlign: align, marginBottom: 40, maxWidth: align === 'center' ? undefined : '14em' }}>
      {eyebrow && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--copper-label)', marginBottom: 18 }}>
          {eyebrow}
        </div>
      )}
      <h1
        style={{
          fontFamily: 'var(--serif-display)',
          fontSize: 'clamp(34px, 7vw, 56px)',
          lineHeight: 1.06,
          letterSpacing: '-0.012em',
          color: 'var(--bone)',
          margin: 0,
          fontWeight: 500,
        }}
      >
        {title}
      </h1>
      {sub && (
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 17, lineHeight: 1.55, color: 'var(--bone-dim)', margin: '20px 0 0', maxWidth: '30em' }}>
          {sub}
        </p>
      )}
    </header>
  );
}

/** A small filled dye/warm dot — the ledger's only mark beside a name. */
export function WarmDot({ filled = true, size = 5, color }: { filled?: boolean; size?: number; color?: string }) {
  const c = color ?? 'var(--warm)';
  return <span aria-hidden style={{ width: size, height: size, borderRadius: '50%', background: filled ? c : 'transparent', border: filled ? 'none' : `1px solid ${c}`, flex: '0 0 auto', display: 'inline-block' }} />;
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
}) {
  const tint = dye ? dyeVar(dye) : 'var(--warm)';
  const hasLedgerMeta = year != null || author != null || dye != null;
  const fontFor = (f: 'serif' | 'sans' | 'display') =>
    f === 'sans' ? 'var(--sans)' : f === 'display' ? 'var(--serif-display)' : 'var(--serif)';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="hl-ledger-row"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 20,
        width: '100%',
        textAlign: 'left',
        padding: '15px 0',
        background: 'none',
        borderWidth: 0,
        borderBottom: noBorder ? 'none' : '1px solid var(--rule)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 180ms var(--ease)',
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: fontFor(titleFont), fontStyle: italic ? 'italic' : 'normal', fontWeight: 400, fontSize: titleFont === 'display' ? Math.max(titleSize, 24) : titleSize, lineHeight: 1.3, color: titleColor, display: 'block' }}>
          {title}
        </span>
        {sub && <span style={{ fontFamily: fontFor(subFont), fontStyle: subItalic ? 'italic' : 'normal', fontSize: 13, color: subColor, display: 'block', marginTop: 4, lineHeight: 1.5 }}>{sub}</span>}
      </span>

      {hasLedgerMeta ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', flex: '0 0 auto' }}>
          {year != null && <span style={{ color: dateColor }}>{year}</span>}
          {dye && <WarmDot color={tint} size={5} />}
          {author != null && <span style={{ color: tint, textTransform: 'uppercase', letterSpacing: '0.16em' }}>{author}</span>}
        </span>
      ) : (
        meta != null && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: dateColor, whiteSpace: 'nowrap', flex: '0 0 auto' }}>{meta}</span>
        )
      )}
    </button>
  );
}

/** Uppercase mono group label (MEMORIES / LETTERS / VOICES). The design mutes
 *  these dividers to a quiet grey-brown; pass tone="copper" for the rare label
 *  the design keeps in dimmed copper. */
export function SectionLabel({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'copper' }) {
  return <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: tone === 'copper' ? 'var(--copper-label)' : 'var(--muted-4)', margin: '34px 0 8px' }}>{children}</div>;
}

/** The ∞ wax seal — the product's only mark, resting warm at the foot of a page. */
export function WaxSeal({ size = 30 }: { size?: number }) {
  return (
    <div aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size * 2.2, height: size * 2.2,
      background: 'radial-gradient(circle, var(--warm-glow) 0%, transparent 68%)' }}>
      <span style={{ color: 'var(--warm)', fontSize: size, lineHeight: 1, opacity: 0.92,
        textShadow: '0 0 24px var(--warm-glow), 0 0 8px var(--warm-glow)' }}>∞</span>
    </div>
  );
}
