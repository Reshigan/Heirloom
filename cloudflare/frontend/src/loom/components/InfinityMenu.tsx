import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * InfinityMenu — the ∞ is the only mark in the product, and on the index it
 * is also the way out to the two artifacts drawn FROM the Deep: the Wrapped
 * (the year, read back) and the Book (the printed thread). Tapping the mark
 * opens a quiet hairline menu — never a chatbot, never an icon row.
 */

import { EASE } from '../motion';
import { SurfaceRing } from '../cosmic/CosmicUI';

const ITEMS: Array<{ label: string; to: string; hint: string }> = [
  { label: 'search',      to: '/search',      hint: 'find anything settled' },
  { label: 'inbox',       to: '/inbox',       hint: 'what has reached you' },
  { label: 'on this day', to: '/on-this-day', hint: 'this date, before' },
  { label: 'export',      to: '/export',      hint: 'the Deep, to keep' },
];

export function InfinityMenu({ glyph }: { glyph?: string } = {}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Dismiss on outside click. Escape closes and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); triggerRef.current?.focus(); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Roving focus: on open, focus the first menuitem.
  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  // ArrowDown/Up cycle, Home/End jump to first/last.
  const onMenuKey = (e: React.KeyboardEvent, i: number) => {
    const last = ITEMS.length - 1;
    let next = -1;
    if (e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
    else if (e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next !== -1) { e.preventDefault(); itemRefs.current[next]?.focus(); }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="What the Deep holds"
        onClick={() => setOpen((o) => !o)}
        className="loom-serif"
        style={{
          background: 'none', border: 0, padding: 0, cursor: 'pointer',
          minWidth: 44, minHeight: 44,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1,
          color: open ? 'var(--warm)' : 'var(--bone-dim)',
          transition: `color 180ms ${EASE}`,
        }}
      >
        {glyph ?? <SurfaceRing size={14} />}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="What the Deep holds"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 168, background: 'var(--ink)',
            border: '1px solid var(--rule)',
            zIndex: 40,
            animation: `infmenu-in 180ms ${EASE}`,
          }}
        >
          {ITEMS.map((it, i) => (
            <button
              key={it.to}
              ref={(el) => { itemRefs.current[i] = el; }}
              type="button"
              role="menuitem"
              tabIndex={i === 0 ? 0 : -1}
              onClick={() => { setOpen(false); navigate(it.to); }}
              onKeyDown={(e) => onMenuKey(e, i)}
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
                  display: 'block', fontFamily: 'var(--mono)', fontSize: 11,
                  letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone)',
                  marginBottom: 3,
                }}
              >
                {it.label}
              </span>
              <span
                style={{
                  display: 'block', fontFamily: 'var(--serif)', fontStyle: 'italic',
                  fontSize: 12, color: 'var(--bone-dim)',
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
