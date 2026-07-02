// Zero-cost, first-party attribution.
//
// captureRef(): on boot, lift ?ref= off the landing URL into localStorage (so
// it survives the browse → signup journey) and fire one page-view beacon per
// session to the worker's site_visits counter (day × ref × path only — no
// cookies, no IP, no fingerprinting).
//
// signupSource(): what Signup sends with /auth/register.

const KEY = 'heirloom-ref';

export function captureRef(): void {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref && /^[a-z0-9_-]{1,32}$/i.test(ref)) localStorage.setItem(KEY, ref);
    if (!sessionStorage.getItem('hl-visit-sent')) {
      sessionStorage.setItem('hl-visit-sent', '1');
      // Mirrors services/api.ts — VITE_API_URL already carries the /api suffix.
      const base = import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api';
      navigator.sendBeacon?.(
        `${base}/metrics/visit`,
        new Blob(
          [JSON.stringify({ ref: ref ?? localStorage.getItem(KEY) ?? '', path: window.location.pathname })],
          { type: 'application/json' },
        ),
      );
    }
  } catch { /* attribution must never break the app */ }
}

export function signupSource(): string | undefined {
  try { return localStorage.getItem(KEY) ?? undefined; } catch { return undefined; }
}
