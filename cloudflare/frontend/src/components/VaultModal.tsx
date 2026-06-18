/**
 * VaultModal — unlocking the thread's DORMANT client-side vault.
 *
 * Heirloom's live encryption is server-held AES-GCM: entries are encrypted at
 * rest with a platform-held key, so a forgotten passphrase never loses the
 * family archive. New signups therefore provision NO client passphrase vault.
 *
 * This modal exists for back-compat only: an existing user who PREVIOUSLY
 * enabled the dormant client vault still has client-encrypted entries and must
 * be able to unlock them. It is rendered solely from Login when the server
 * reports encryptionEnabled && !unlocked. It NEVER provisions a new client key
 * (the old mode="setup" / encryptionService.setupEncryption flow is removed) so
 * it cannot contradict the server-held model.
 *
 * Loom-native: a hairline-framed panel over a solid ink scrim (no glass, no
 * backdrop-blur, no floating card). Open/close + error reveal are CSS-driven
 * with the loom tokens (180/360/720ms, var(--loom-ease)). The unlock logic
 * (encryptionService.unlockVault) is preserved verbatim.
 */

import { useState, useEffect, useRef } from 'react';
import { encryptionService } from '../services/encryptionService';

interface VaultModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function VaultModal({ isOpen, onComplete }: VaultModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
    const trap = (e: KeyboardEvent) => {
      // Unlock is mandatory for client-vault users — Escape does not dismiss.
      if (e.key !== 'Tab') return;
      const nodes = Array.from(focusable);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [isOpen]);

  const handleUnlock = async () => {
    if (!passphrase) {
      setError('Enter your passphrase.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await encryptionService.unlockVault(passphrase);
      if (success) {
        onComplete();
      } else {
        setError('That passphrase is wrong. Try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Could not unlock the thread.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUnlock();
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 10,
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--bone-dim)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--ink)',
    border: '1px solid var(--rule)',
    borderRadius: 0,
    color: 'var(--bone)',
    padding: '11px 14px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      aria-hidden={!isOpen}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--ink)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity var(--loom-dur-veil) var(--loom-ease)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--ink-card)',
          border: '1px solid var(--rule)',
          borderRadius: 0,
          padding: '40px 36px',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(8px)',
          transition:
            'opacity var(--loom-dur-shift) var(--loom-ease), transform var(--loom-dur-shift) var(--loom-ease)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span
            aria-hidden
            style={{
              display: 'block',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 40,
              color: 'var(--warm)',
              marginBottom: 18,
            }}
          >
            ∞
          </span>
          <h2
            className="loom-h2"
            style={{ fontSize: 26, fontWeight: 300, margin: '0 0 10px', letterSpacing: '-0.014em' }}
          >
            Unlock your thread
          </h2>
          <p
            className="loom-body"
            style={{ fontSize: 14, color: 'var(--bone-dim)', lineHeight: 1.6, margin: 0 }}
          >
            Enter the passphrase you set when you sealed this thread, to read your encrypted entries.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
          {error ? (
            <p
              role="alert"
              className="loom-body"
              style={{
                margin: 0,
                padding: '12px 14px',
                background: 'var(--ink)',
                border: '1px solid var(--rule-warm)',
                borderRadius: 0,
                fontStyle: 'italic',
                fontSize: 13.5,
                color: 'var(--warm)',
                animation: 'none',
              }}
            >
              {error}
            </p>
          ) : null}

          <div>
            <label htmlFor="thread-passphrase" style={labelStyle}>
              Passphrase
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="thread-passphrase"
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="your passphrase"
                style={{ ...inputStyle, paddingRight: 64 }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9.5,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-dim)',
                }}
              >
                {showPassphrase ? 'hide' : 'show'}
              </button>
            </div>
            <p
              className="loom-body"
              style={{ margin: '12px 0 0', fontSize: 13, fontStyle: 'italic', color: 'var(--bone-dim)' }}
            >
              The three or four words you chose when you sealed the thread.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="loom-btn"
            style={{
              width: '100%',
              marginTop: 6,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? 'unlocking…' : 'unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
