import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useFocusTrap } from '../lib/useFocusTrap';
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
 * PwaNudge — the install reminder and notification opt-in.
 * Mounted once at the app root. Appears after 8s, respects 14-day dismissal.
 * §2.6: hairline border, ink/bone/warm, ∞ as the only mark, 0px radius, the one
 * canonical easing — no glass, no gradient, no icon library.
 */
type Mode = 'hidden' | 'install' | 'ios' | 'notify';

const APPEAR_DELAY_MS = 15_000;

// Only show after 3+ page views (not on the first landing page impression)
const MIN_VIEWS = 3;
const pageViewKey = 'hl-pwa-views';
const pageViews = parseInt(localStorage.getItem(pageViewKey) ?? '0', 10) + 1;
localStorage.setItem(pageViewKey, String(pageViews));
const hasEnoughViews = pageViews >= MIN_VIEWS;

function IOSSteps() {
  const stepStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  };
  const numStyle: React.CSSProperties = {
    fontFamily: 'var(--mono, "Space Mono", monospace)',
    fontSize: 9,
    letterSpacing: '0.14em',
    color: 'var(--warm, #e0a062)',
    border: '1px solid var(--warm, #e0a062)',
    borderRadius: 0,
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  };
  const textStyle: React.CSSProperties = {
    fontFamily: 'var(--sans, Inter, system-ui, sans-serif)',
    fontSize: 13,
    lineHeight: 1.55,
    color: 'var(--bone-dim, rgba(242,230,208,0.72))',
  };

  return (
    <div style={{ marginTop: 14 }}>
      <div style={stepStyle}>
        <div style={numStyle}>1</div>
        <p style={textStyle}>Tap the <strong style={{ color: 'var(--bone, #f2e6d0)', fontWeight: 500 }}>Share</strong> button at the bottom of Safari</p>
      </div>
      <div style={stepStyle}>
        <div style={numStyle}>2</div>
        <p style={textStyle}>Scroll down and tap <strong style={{ color: 'var(--bone, #f2e6d0)', fontWeight: 500 }}>Add to Home Screen</strong></p>
      </div>
      <div style={stepStyle}>
        <div style={numStyle}>3</div>
        <p style={textStyle}>Tap <strong style={{ color: 'var(--bone, #f2e6d0)', fontWeight: 500 }}>Add</strong> — the thread is yours, one tap away</p>
      </div>
    </div>
  );
}

export function PwaNudge() {
  const { isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<Mode>('hidden');
  const [dwellElapsed, setDwellElapsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => onInstallStateChange(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    if (!hasEnoughViews) return; // wait for enough page views
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
    if (isAuthenticated && webPushEnabled() && notificationPermission() === 'default') {
      setMode('notify');
      return;
    }
    setMode('hidden');
  }, [dwellElapsed, isAuthenticated, tick]);

  const dismiss = useCallback(() => {
    markDismissed();
    setMode('hidden');
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, dismiss, mode !== 'hidden');

  const onInstall = useCallback(async () => {
    setBusy(true);
    const accepted = await promptInstall();
    setBusy(false);
    if (accepted) setMode('hidden');
    else { markDismissed(); setMode('hidden'); }
  }, []);

  const onEnableNotify = useCallback(async () => {
    setBusy(true);
    await enableWebPush();
    setBusy(false);
    setMode('hidden');
  }, []);

  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (mode === 'hidden') { setShown(false); return; }
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, [mode]);

  if (mode === 'hidden') return null;

  return (
    <aside
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: isAuthenticated ? 'calc(72px + env(safe-area-inset-bottom, 0px))' : 0,
        zIndex: 60,
        padding: isAuthenticated ? '0 16px 16px' : '0 16px max(16px, env(safe-area-inset-bottom, 16px))',
        pointerEvents: 'none',
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 360ms var(--ease), transform 360ms var(--ease)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-nudge-title"
        style={{
          maxWidth: 448,
          margin: '0 auto',
          pointerEvents: 'auto',
          background: 'var(--ink-card, #171714)',
          border: '1px solid var(--rule, rgba(242,230,208,0.11))',
          borderTop: '2px solid var(--warm, #e0a062)',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {/* Tapestry cloth motif — six dye threads (signal, not block fill):
            fixed 2px lines, left-aligned, with transparent gaps between. */}
        <div style={{ display: 'flex', height: 3, gap: 5 }}>
          {(['madder','saffron','indigo','cochineal','weld','woad'] as const).map((d) => (
            <div key={d} style={{ width: 2, background: `var(--dye-${d})`, opacity: 0.9 }} />
          ))}
        </div>

        <div style={{ padding: '18px 20px 20px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/icon.svg"
                alt="Heirloom"
                loading="lazy"
                width={36}
                height={36}
                style={{ display: 'block', borderRadius: 0, flexShrink: 0 }}
              />
              <div>
                <p style={{
                  fontFamily: 'var(--mono, "Space Mono", monospace)',
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--warm, #e0a062)',
                  margin: 0,
                  lineHeight: 1,
                  marginBottom: 4,
                }}>
                  {mode === 'notify' ? 'Stay in the thread' : 'Install on your phone'}
                </p>
                <p id="pwa-nudge-title" style={{
                  fontFamily: 'var(--serif, "Spectral", Georgia, serif)',
                  fontSize: 17,
                  fontWeight: 300,
                  lineHeight: 1.25,
                  color: 'var(--bone, #f2e6d0)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}>
                  {mode === 'install' && 'One tap from the next memory'}
                  {mode === 'ios' && 'Add to your home screen'}
                  {mode === 'notify' && 'Turn on thread reminders'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              style={{
                background: 'transparent',
                border: 0,
                minWidth: 44,
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--mono, "Space Mono", monospace)',
                fontSize: 14,
                color: 'var(--bone-dim, rgba(242,230,208,0.55))',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Body copy */}
          <p style={{
            fontFamily: 'var(--sans, Inter, system-ui, sans-serif)',
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--bone-dim, rgba(242,230,208,0.72))',
            margin: 0,
          }}>
            {mode === 'install' && 'Heirloom lives on your home screen. Full-screen, works offline, always ready for the next entry — no browser chrome in the way.'}
            {mode === 'ios' && 'Three taps and Heirloom is yours — full-screen, works offline, always one tap from the next memory.'}
            {mode === 'notify' && 'A quiet nudge when it\'s your turn to add, or when a sealed entry unlocks. No noise — only the thread.'}
          </p>

          {/* iOS steps */}
          {mode === 'ios' && <IOSSteps />}

          {/* Actions */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 20 }}>
            {mode === 'install' && (
              <button
                type="button"
                onClick={onInstall}
                disabled={busy}
                style={{
                  background: 'transparent',
                  color: 'var(--warm, #e0a062)',
                  border: '1px solid var(--warm, #e0a062)',
                  borderRadius: 0,
                  padding: '9px 20px',
                  fontFamily: 'var(--mono, "Space Mono", monospace)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: busy ? 'wait' : 'pointer',
                  opacity: busy ? 0.6 : 1,
                  transition: 'opacity 180ms var(--ease)',
                }}
              >
                {busy ? 'installing…' : 'install now →'}
              </button>
            )}
            {mode === 'notify' && (
              <button
                type="button"
                onClick={onEnableNotify}
                disabled={busy}
                style={{
                  background: 'transparent',
                  color: 'var(--warm, #e0a062)',
                  border: '1px solid var(--warm, #e0a062)',
                  borderRadius: 0,
                  padding: '9px 20px',
                  fontFamily: 'var(--mono, "Space Mono", monospace)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: busy ? 'wait' : 'pointer',
                  opacity: busy ? 0.6 : 1,
                  transition: 'opacity 180ms var(--ease)',
                }}
              >
                {busy ? 'enabling…' : 'enable →'}
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--mono, "Space Mono", monospace)',
                fontSize: 11,
                letterSpacing: '0.06em',
                color: 'var(--bone-dim, rgba(242,230,208,0.55))',
              }}
            >
              {mode === 'ios' ? 'maybe later' : 'not now'}
            </button>
          </div>

          {/* Reassurance */}
          {(mode === 'install' || mode === 'ios') && (
            <p style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--rule, rgba(242,230,208,0.11))',
              fontFamily: 'var(--mono, "Space Mono", monospace)',
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim, rgba(242,230,208,0.55))',
              margin: '14px 0 0',
            }}>
              offline · daily prompt · no notifications until you ask
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

export default PwaNudge;
