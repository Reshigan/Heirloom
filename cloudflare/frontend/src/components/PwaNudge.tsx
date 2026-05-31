import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import {
  getDeferredPrompt,
  isDismissedRecently,
  isIOS,
  isStandalone,
  markDismissed,
  onInstallStateChange,
  promptInstall,
  wasInstalled,
} from '../lib/pwa';
import { enableWebPush, notificationPermission, webPushEnabled } from '../lib/webPush';

/**
 * PwaNudge — the install reminder and notification opt-in, as one quiet
 * bottom-anchored card. Mounted once at the app root.
 *
 * Adoption, in priority order:
 *   1. install   — Chromium captured `beforeinstallprompt`; one tap installs.
 *   2. ios        — iOS Safari can't prompt; show the Share → Add to Home Screen hint.
 *   3. notify     — already installed + signed in + push configured; offer reminders.
 *
 * Considered, never naggy: nothing for the first 18s of a session, never within
 * 14 days of a dismissal, never once installed (for the install branches).
 * §2.6: hairline border, ink/bone/warm, ∞ as the only mark, 2px radius, the one
 * canonical easing — no glass, no gradient, no icon.
 */
type Mode = 'hidden' | 'install' | 'ios' | 'notify';

const APPEAR_DELAY_MS = 18_000;

export function PwaNudge() {
  const { isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<Mode>('hidden');
  const [dwellElapsed, setDwellElapsed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-evaluate whenever install availability changes (the prompt can arrive
  // after our dwell timer) or auth flips.
  const [tick, setTick] = useState(0);
  useEffect(() => onInstallStateChange(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    const t = setTimeout(() => setDwellElapsed(true), APPEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!dwellElapsed) return;
    if (isDismissedRecently()) return;

    const installed = isStandalone() || wasInstalled();

    if (!installed && getDeferredPrompt()) {
      setMode('install');
      return;
    }
    if (!installed && isIOS()) {
      setMode('ios');
      return;
    }
    if (
      isAuthenticated &&
      webPushEnabled() &&
      notificationPermission() === 'default'
    ) {
      setMode('notify');
      return;
    }
    setMode('hidden');
  }, [dwellElapsed, isAuthenticated, tick]);

  const dismiss = useCallback(() => {
    markDismissed();
    setMode('hidden');
  }, []);

  const onInstall = useCallback(async () => {
    setBusy(true);
    const accepted = await promptInstall();
    setBusy(false);
    if (accepted) setMode('hidden');
    else markDismissed(), setMode('hidden');
  }, []);

  const onEnableNotify = useCallback(async () => {
    setBusy(true);
    await enableWebPush();
    setBusy(false);
    setMode('hidden');
  }, []);

  if (mode === 'hidden') return null;

  const copy = {
    install: {
      eyebrow: 'Keep it close',
      title: 'Install Heirloom',
      body: 'Add the thread to your home screen — it opens full-screen, works offline, and is one tap from the next entry.',
      action: 'Install',
      run: onInstall,
    },
    ios: {
      eyebrow: 'Keep it close',
      title: 'Add to your home screen',
      body: 'Tap the Share control, then “Add to Home Screen.” The thread opens full-screen, one tap from the next entry.',
      action: null,
      run: undefined,
    },
    notify: {
      eyebrow: 'Stay in the thread',
      title: 'Turn on thread reminders',
      body: 'A quiet nudge when it’s your turn to add, or when a sealed entry unlocks. No noise — only the thread.',
      action: 'Enable',
      run: onEnableNotify,
    },
  }[mode];

  return (
    <AnimatePresence>
      <motion.aside
        key={mode}
        role="dialog"
        aria-label={copy.title}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
      >
        <div className="mx-auto max-w-md pointer-events-auto bg-void-surface border border-paper-15 rounded-[2px] p-5 shadow-[0_-1px_0_0_rgba(176,122,74,0.25)]">
          <div className="flex items-start gap-4">
            <span className="font-body text-2xl text-gold leading-none mt-0.5" aria-hidden>∞</span>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[0.62rem] tracking-[0.3em] uppercase text-gold mb-1.5">{copy.eyebrow}</p>
              <h2 className="font-body font-light text-lg leading-snug tracking-[-0.01em]">{copy.title}</h2>
              <p className="mt-2 text-sm text-paper-65 leading-relaxed font-light">{copy.body}</p>

              <div className="mt-4 flex items-center gap-5">
                {copy.action ? (
                  <button type="button" onClick={copy.run} disabled={busy} className="btn btn-primary">
                    {busy ? 'One moment…' : copy.action}
                    {!busy ? <span aria-hidden> →</span> : null}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-xs text-paper-50 hover:text-paper transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

export default PwaNudge;
