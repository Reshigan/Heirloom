import { useEffect } from 'react';
import { useLoomTheme, type LoomTheme } from '../theme';

/**
 * paper · vault · system — three-mode theme switcher.
 * Displayed as a small mono-caps segmented control.
 * Default is 'dark' (vault). Persisted across sessions.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useLoomTheme();

  useEffect(() => {
    document.querySelectorAll('.loom').forEach((el) => {
      // System resolves at runtime; dark/light applied directly
      const resolved =
        theme === 'system'
          ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme;
      el.setAttribute('data-theme', resolved);
    });
  }, [theme]);

  const modes: { key: LoomTheme; label: string }[] = [
    { key: 'light',  label: 'paper'  },
    { key: 'dark',   label: 'vault'  },
    { key: 'system', label: 'system' },
  ];

  return (
    <span className="loom-theme-pill" role="group" aria-label="Theme">
      {modes.map((m) => (
        <button
          key={m.key}
          className={theme === m.key ? 'on' : ''}
          onClick={() => setTheme(m.key)}
          aria-pressed={theme === m.key}
        >
          {m.label}
        </button>
      ))}
    </span>
  );
}
