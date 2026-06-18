import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * InfinityMenu — the ∞ is the only mark in the product, and on the index it
 * is also the way out to the two artifacts woven FROM the cloth: the Wrapped
 * (the year, read back) and the Book (the printed cloth). Tapping the mark
 * opens a quiet hairline menu — never a chatbot, never an icon row.
 */

import { EASE } from '../motion';

const ITEMS: Array<{ label: string; to: string; hint: string }> = [
  { label: 'search',      to: '/search',      hint: 'find any thread' },
  { label: 'inbox',       to: '/inbox',       hint: 'what has reached you' },
  { label: 'on this day', to: '/on-this-day', hint: 'this date, before' },
  { label: 'export',      to: '/export',      hint: 'the cloth, to keep' },
  { label: 'wrapped',     to: '/wrapped',     hint: 'your year, read back' },
  { label: 'book',        to: '/book',        hint: 'the cloth, in print' },
];

export function InfinityMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Dismiss on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open the cloth's artifacts"
        onClick={() => setOpen((o) => !o)}
        className="loom-serif"
        style={{
          background: 'none', border: 0, padding: '2px 6px', cursor: 'pointer',
          fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1,
          color: open ? 'var(--warm)' : 'var(--bone-dim)',
          transition: `color 180ms ${EASE}`,
        }}
      >
        ∞
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 168, background: 'var(--ink)',
            border: '1px solid var(--rule)', borderTop: '1px solid var(--warm)',
            zIndex: 40,
            animation: `infmenu-in 180ms ${EASE}`,
          }}
        >
          {ITEMS.map((it, i) => (
            <button
              key={it.to}
              role="menuitem"
              type="button"
              onClick={() => { setOpen(false); navigate(it.to); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', cursor: 'pointer',
                border: 0, borderTop: i === 0 ? 0 : '1px solid var(--rule)',
                padding: '12px 16px',
              }}
            >
              <span
                className="loom-mono"
                style={{
                  display: 'block', fontFamily: 'var(--mono)', fontSize: 10,
                  letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone)',
                  marginBottom: 3,
                }}
              >
                {it.label}
              </span>
              <span
                style={{
                  display: 'block', fontFamily: 'var(--serif)', fontStyle: 'italic',
                  fontSize: 12, color: 'var(--bone-faint)',
                }}
              >
                {it.hint}
              </span>
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes infmenu-in { from { opacity: 0; transform: translateX(-50%) translateY(-4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

export default InfinityMenu;
