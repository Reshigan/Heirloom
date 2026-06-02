import { useEffect, useState, useCallback } from 'react';
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

const APPEAR_DELAY_MS = 8_000;

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

  // A one-shot CSS entrance (rise + fade) on the canonical easing — replaces the
  // framer-motion mount so the bottom card obeys the constitution's single curve.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (mode === 'hidden') {
      setShown(false);
      return;
    }
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, [mode]);

  if (mode === 'hidden') return null;

  const copy = {
    install: {
      eyebrow: 'Install on your phone',
      title: 'Keep the thread one tap away',
      body: 'Add Heirloom to your home screen — it opens full-screen, works offline, and is one tap from the next entry.',
      reassurance: 'offline · daily prompt · no notifications until you ask',
      action: 'Install',
      run: onInstall,
    },
    ios: {
      eyebrow: 'Install on your phone',
      title: 'Keep the thread one tap away',
      body: 'Tap Share, then “Add to Home Screen.” The thread opens full-screen, one tap from the next entry.',
      reassurance: 'offline · daily prompt · no notifications until you ask',
      action: null,
      run: undefined,
    },
    notify: {
      eyebrow: 'Stay in the thread',
      title: 'Turn on thread reminders',
      body: 'A quiet nudge when it’s your turn to add, or when a sealed entry unlocks. No noise — only the thread.',
      reassurance: null as string | null,
      action: 'Enable',
      run: onEnableNotify,
    },
  }[mode];

  return (
    <aside
      role="dialog"
      aria-label={copy.title}
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: isAuthenticated ? 'calc(52px + env(safe-area-inset-bottom, 0px))' : 0,
        zIndex: 60,
        padding: isAuthenticated ? '0 16px 16px' : '0 16px max(16px, env(safe-area-inset-bottom, 0px))',
        pointerEvents: 'none',
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 360ms var(--loom-ease), transform 360ms var(--loom-ease)',
      }}
    >
      <div
        style={{
          maxWidth: 448,
          margin: '0 auto',
          pointerEvents: 'auto',
          background: 'var(--ink-card)',
          border: '1px solid var(--rule)',
          borderTop: '1px solid var(--rule-warm)',
          borderRadius: 2,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <span
            className="loom-serif"
            style={{ fontSize: 24, color: 'var(--warm)', lineHeight: 1, marginTop: 2, fontWeight: 300 }}
            aria-hidden
          >
            ∞
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="loom-eyebrow" style={{ color: 'var(--warm)', marginBottom: 6 }}>
              {copy.eyebrow}
            </p>
            <h2 className="loom-serif" style={{ fontSize: 18, fontWeight: 300, lineHeight: 1.3, margin: 0, letterSpacing: '-0.01em' }}>
              {copy.title}
            </h2>
            <p className="loom-body" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: 'var(--bone-dim)' }}>
              {copy.body}
            </p>

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
              {copy.action ? (
                <button
                  type="button"
                  onClick={copy.run}
                  disabled={busy}
                  className="loom-btn"
                  style={{ opacity: busy ? 0.5 : 1 }}
                >
                  {busy ? 'one moment…' : copy.action.toLowerCase()}
                  {!busy ? <span aria-hidden> →</span> : null}
                </button>
              ) : null}
              <button
                type="button"
                onClick={dismiss}
                className="loom-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  color: 'var(--bone-faint)',
                  transition: 'color 180ms var(--loom-ease)',
                }}
              >
                not now
              </button>
            </div>

            {copy.reassurance ? (
              <p
                className="loom-mono"
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid var(--rule)',
                  fontSize: 9.5,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                }}
              >
                {copy.reassurance}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default PwaNudge;
