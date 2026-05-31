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
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 18 }}>
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <span key={opt.value} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 18 }}>
            {i > 0 ? (
              <span
                className="loom-mono"
                style={{ fontSize: 10, color: 'var(--loom-bone-ghost)' }}
                aria-hidden
              >
                /
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className="loom-mono"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: active ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
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
