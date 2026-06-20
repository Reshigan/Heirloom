/**
 * ViewToggle — the canonical Loom view switch.
 *
 * A row of loom-mono uppercase text buttons (no pills, no shadows, no
 * icons). The active option is warm; the rest are bone-dim. Used to
 * switch the tapestry home between its view-modes (canon ↔ pull ↔
 * century) and the Reading Room between wall ↔ book.
 *
 * Per the constitution: view toggles are mono caps text buttons, never
 * icon toggles or pill switches.
 */
export interface ViewToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ViewToggleProps<T extends string> {
  options: ViewToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ViewToggle<T extends string>({
  options,
  value,
  onChange,
}: ViewToggleProps<T>) {
  const move = (dir: number) => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx < 0) return;
    const next = options[(idx + dir + options.length) % options.length];
    onChange(next.value);
  };
  return (
    <span role="radiogroup" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 18 }}>
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <span key={opt.value} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 18 }}>
            {i > 0 ? (
              <span
                className="loom-mono"
                style={{ fontSize: 10, color: 'var(--bone-faint)' }}
                aria-hidden
              >
                /
              </span>
            ) : null}
            <button
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  move(1);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  move(-1);
                }
              }}
              className="loom-mono"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: active ? 'var(--warm)' : 'var(--bone-dim)',
                fontWeight: active ? 700 : 400,
                transition: 'color 180ms var(--ease)',
                minHeight: 44,
                minWidth: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '-15px 0',
              }}
            >
              {opt.label}
            </button>
          </span>
        );
      })}
    </span>
  );
}
