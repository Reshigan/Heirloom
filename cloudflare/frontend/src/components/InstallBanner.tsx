import { useEffect, useState, useCallback } from 'react';
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

/**
 * InstallBanner — a slim fixed top bar on mobile only.
 *
 * Appears after 5s on mobile (< 768px) when the browser has a deferred
 * install prompt or we're on iOS. Complements PwaNudge (the bottom card).
 * Respects the same 14-day dismissal cooldown.
 *
 * Design: warm top hairline, ink background, ∞ mark, one-line install CTA.
 * §2.6: no glass, no gradient, 0px radius, one easing.
 */

const APPEAR_DELAY_MS = 5_000;
const MOBILE_MAX_WIDTH = 768;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_MAX_WIDTH;
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isIOSMode, setIsIOSMode] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => onInstallStateChange(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    if (!isMobile()) return;
    const t = setTimeout(() => {
      if (isDismissedRecently()) return;
      const installed = isStandalone() || wasInstalled();
      if (installed) return;
      if (getDeferredPrompt()) {
        setIsIOSMode(false);
        setVisible(true);
      } else if (isIOS()) {
        setIsIOSMode(true);
        setVisible(true);
      }
    }, APPEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, [tick]);

  useEffect(() => {
    if (!visible) { setShown(false); return; }
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, [visible]);

  const dismiss = useCallback(() => {
    markDismissed();
    setVisible(false);
  }, []);

  const onInstall = useCallback(async () => {
    if (isIOSMode) return;
    setBusy(true);
    const accepted = await promptInstall();
    setBusy(false);
    if (accepted) setVisible(false);
    else { markDismissed(); setVisible(false); }
  }, [isIOSMode]);

  if (!visible) return null;

  return (
    <div
      role="banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 80,
        height: 44,
        background: 'var(--ink-card)',
        borderBottom: '1px solid var(--rule-warm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        gap: 12,
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'opacity 360ms var(--loom-ease), transform 360ms var(--loom-ease)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span
          className="loom-serif"
          style={{ fontSize: 18, color: 'var(--warm)', lineHeight: 1, fontWeight: 300 }}
          aria-hidden
        >
          ∞
        </span>
        <span
          className="loom-body"
          style={{
            fontSize: 13,
            color: 'var(--bone-dim)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isIOSMode
            ? 'Tap Share → Add to Home Screen'
            : 'Add to your home screen'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {!isIOSMode ? (
          <button
            type="button"
            onClick={onInstall}
            disabled={busy}
            className="loom-mono"
            style={{
              background: 'transparent',
              border: '1px solid var(--warm)',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              transition: 'opacity 180ms var(--loom-ease)',
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? '…' : 'install'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="loom-mono"
          style={{
            background: 'transparent',
            border: 0,
            padding: '4px 2px',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            color: 'var(--bone-faint)',
            transition: 'color 180ms var(--loom-ease)',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default InstallBanner;
