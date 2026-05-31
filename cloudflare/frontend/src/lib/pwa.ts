/**
 * PWA install + display helpers.
 *
 * The install reminder is the single largest adoption lever for a PWA: an
 * installed icon on the home screen is opened ~3× more than a bookmarked tab.
 * Chromium fires `beforeinstallprompt`, which we capture and defer so we can
 * surface our own on-brand nudge at a considered moment (never on first paint).
 * iOS Safari has no such event — there we show the manual Share → Add to Home
 * Screen hint instead.
 *
 * Nothing here renders; see components/PwaNudge.tsx.
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'heirloom:install-dismissed-at';
const INSTALLED_KEY = 'heirloom:installed';
// Once dismissed, stay quiet for two weeks — a reminder, never a nag.
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // stop Chrome's default mini-infobar; we drive the timing
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    try {
      localStorage.setItem(INSTALLED_KEY, '1');
    } catch {
      /* private mode — ignore */
    }
    listeners.forEach((fn) => fn());
  });
}

/** Subscribe to install-availability changes (prompt captured / app installed). */
export function onInstallStateChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferred;
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac; detect via touch points.
  const iPadOS = navigator.platform === 'MacIntel' && (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1;
  return iOSUA || iPadOS;
}

export function wasInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function isDismissedRecently(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY);
    if (!at) return false;
    return Date.now() - Number(at) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function markDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** Fire the native install prompt; resolves true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const choice = await deferred.userChoice;
  if (choice.outcome === 'accepted') {
    deferred = null;
    return true;
  }
  return false;
}
