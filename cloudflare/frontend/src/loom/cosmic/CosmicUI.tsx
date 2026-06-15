import type { ReactNode } from 'react';

/** mono uppercase eyebrow + centered serif title — the mockup header on every screen */
export function CosmicHeader({ eyebrow, title, align = 'center' }: { eyebrow: string; title: ReactNode; align?: 'center' | 'left' }) {
  return (
    <header style={{ textAlign: align, marginBottom: 36 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>{eyebrow}</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 34, lineHeight: 1.1, color: 'var(--bone)', marginTop: 10, fontWeight: 400 }}>{title}</h1>
    </header>
  );
}

/** small filled warm dot — the only bullet mark */
export function WarmDot({ filled = true, size = 6 }: { filled?: boolean; size?: number }) {
  return <span aria-hidden style={{ width: size, height: size, borderRadius: '50%', background: filled ? 'var(--warm)' : 'transparent', border: filled ? 'none' : '1px solid var(--warm-dim)', flex: '0 0 auto', display: 'inline-block' }} />;
}

/** list row: dot + serif title (+optional sub) left, mono meta right */
export function EntryRow({ title, sub, meta, italic, onClick }: { title: ReactNode; sub?: ReactNode; meta?: ReactNode; italic?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%', textAlign: 'left', padding: '16px 0', borderBottom: '1px solid var(--rule)', background: 'none', border: 'none', borderBottomStyle: 'solid', cursor: onClick ? 'pointer' : 'default', transition: 'opacity 180ms var(--ease)' }}>
      <span style={{ marginTop: 8 }}><WarmDot /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: italic ? 'italic' : 'normal', fontSize: 18, color: 'var(--bone)', display: 'block' }}>{title}</span>
        {sub && <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--bone-dim)', display: 'block', marginTop: 3 }}>{sub}</span>}
      </span>
      {meta && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--bone-dim)', whiteSpace: 'nowrap', marginTop: 4 }}>{meta}</span>}
    </button>
  );
}

/** uppercase mono group label (MEMORIES / LETTERS / VOICES) */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--bone-faint)', margin: '28px 0 6px' }}>{children}</div>;
}

/** the ∞ wax seal — the product's only mark */
export function WaxSeal({ size = 30 }: { size?: number }) {
  return <div aria-hidden style={{ textAlign: 'center', color: 'var(--warm)', fontSize: size, lineHeight: 1, opacity: 0.9 }}>∞</div>;
}
