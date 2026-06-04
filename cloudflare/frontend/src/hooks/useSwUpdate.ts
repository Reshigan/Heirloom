import { useEffect, useState } from 'react';

/**
 * Detects when a new service worker is installed and waiting.
 * Checks on mount and re-checks every time the tab regains focus.
 * `applyUpdate` sends SKIP_WAITING and reloads once the new SW activates.
 */
export function useSwUpdate() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const check = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        if (reg.waiting) {
          setUpdateReady(true);
          return;
        }

        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        }, { once: true }); // once: prevent listener accumulation on repeated check() calls

        reg.update().catch(() => {});
      } catch { /* not available in this context */ }
    };

    check();

    const onFocus = () => {
      navigator.serviceWorker.getRegistration()
        .then(reg => reg?.update())
        .catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const applyUpdate = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg?.waiting) return;
      reg.waiting.postMessage('SKIP_WAITING');
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => window.location.reload(),
        { once: true }
      );
    } catch { /* ignore */ }
  };

  return { updateReady, applyUpdate };
}
