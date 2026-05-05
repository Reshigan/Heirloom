import { useEffect } from 'react';
import { useLoomTheme } from '../theme';

/**
 * Vault / paper toggle pill. Two-state, localStorage-persisted via
 * useLoomTheme. Displays as a small mono-caps segmented control.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useLoomTheme();

  // Mirror onto the .loom root via theme.ts; this effect is just so that
  // tests / hot-reloads pick up immediately.
  useEffect(() => {
    document.querySelectorAll('.loom').forEach((el) => {
      el.setAttribute('data-theme', theme);
    });
  }, [theme]);

  return (
    <span className="loom-theme-pill" role="group" aria-label="Theme">
      <button
        className={theme === 'dark' ? 'on' : ''}
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
      >
        vault
      </button>
      <button
        className={theme === 'light' ? 'on' : ''}
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
      >
        paper
      </button>
    </span>
  );
}
