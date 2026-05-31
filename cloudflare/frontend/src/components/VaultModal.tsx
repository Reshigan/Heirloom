/**
 * VaultModal — sealing / unlocking the thread's encryption.
 *
 * Two ceremonies:
 * 1. After signup — set the passphrase that seals the thread (mode="setup")
 * 2. After login — unlock the thread with the existing passphrase (mode="unlock")
 *
 * Loom-native: a hairline-framed panel over a solid ink scrim (no glass, no
 * backdrop-blur, no floating card). Open/close + error reveal are CSS-driven
 * with the loom tokens (180/360/720ms, var(--loom-ease)). All encryption logic
 * (encryptionService.setupEncryption / unlockVault) is preserved verbatim.
 */

import { useState } from 'react';
import { encryptionService } from '../services/encryptionService';

interface VaultModalProps {
  isOpen: boolean;
  mode: 'setup' | 'unlock';
  onComplete: () => void;
  onSkip?: () => void; // Only for setup mode — allows skipping encryption
}

// A passphrase is three or four words you choose — easier to remember, harder
// to crack. We require four-plus words and a reasonable floor of characters so
// the derived key keeps its strength (PBKDF2 input is the raw string).
const MIN_WORDS = 4;
const MIN_CHARS = 16;
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function VaultModal({ isOpen, mode, onComplete, onSkip }: VaultModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const words = countWords(passphrase);
  const passphraseChecks = [
    { label: 'Four or more words', valid: words >= MIN_WORDS },
    { label: 'At least 16 characters', valid: passphrase.length >= MIN_CHARS },
  ];

  const isPassphraseValid = passphraseChecks.every((check) => check.valid);

  const handleSetup = async () => {
    if (!isPassphraseValid) {
      setError('Choose a passphrase of four or more words.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError('The two passphrases do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await encryptionService.setupEncryption(passphrase);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Could not seal the thread.');
    } finally {
      setIsLoading(false);
    }
  };

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
    if (mode === 'setup') {
      handleSetup();
    } else {
      handleUnlock();
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 10,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--loom-bone-faint)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--loom-ink)',
    border: '1px solid var(--loom-rule)',
    borderRadius: 2,
    color: 'var(--loom-bone)',
    padding: '11px 14px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 15,
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
        background: 'var(--loom-ink)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity var(--loom-dur-veil) var(--loom-ease)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--loom-ink-card)',
          border: '1px solid var(--loom-rule)',
          borderRadius: 2,
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
              fontFamily: "'Source Serif 4', serif",
              fontSize: 40,
              color: 'var(--loom-warm)',
              marginBottom: 18,
            }}
          >
            ∞
          </span>
          <h2
            className="loom-h2"
            style={{ fontSize: 26, fontWeight: 300, margin: '0 0 10px', letterSpacing: '-0.014em' }}
          >
            {mode === 'setup' ? 'Seal your thread' : 'Unlock your thread'}
          </h2>
          <p
            className="loom-body"
            style={{ fontSize: 14, color: 'var(--loom-bone-dim)', lineHeight: 1.6, margin: 0 }}
          >
            {mode === 'setup'
              ? 'Choose a passphrase to encrypt every entry. It is separate from your sign-in password and is the one thing only you hold.'
              : 'Enter your passphrase to read your encrypted entries.'}
          </p>
        </div>

        {/* Zero-knowledge assurance (kept — on-brief) */}
        <div
          style={{
            marginBottom: 24,
            padding: '14px 16px',
            background: 'var(--loom-ink)',
            border: '1px solid var(--loom-rule-warm)',
            borderRadius: 2,
          }}
        >
          <p
            className="loom-body"
            style={{ fontSize: 12.5, color: 'var(--loom-bone-dim)', lineHeight: 1.6, margin: 0 }}
          >
            <strong style={{ color: 'var(--loom-warm)', fontWeight: 600 }}>Zero-knowledge.</strong>{' '}
            Your passphrase never leaves this device. We cannot read or recover your entries without it.
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
                background: 'var(--loom-ink)',
                border: '1px solid var(--loom-rule-warm)',
                borderRadius: 2,
                fontStyle: 'italic',
                fontSize: 13.5,
                color: 'var(--loom-warm)',
                animation: 'none',
              }}
            >
              {error}
            </p>
          ) : null}

          <div>
            <label htmlFor="thread-passphrase" style={labelStyle}>
              {mode === 'setup' ? 'Set your passphrase' : 'Passphrase'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="thread-passphrase"
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={mode === 'setup' ? 'four words you choose' : 'your passphrase'}
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
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9.5,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--loom-bone-faint)',
                }}
              >
                {showPassphrase ? 'hide' : 'show'}
              </button>
            </div>
            {mode === 'unlock' ? (
              <p
                className="loom-body"
                style={{ margin: '12px 0 0', fontSize: 13, fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}
              >
                The three or four words you chose when you sealed the thread.
              </p>
            ) : null}
          </div>

          {/* Setup-only: word-passphrase guidance + confirm */}
          {mode === 'setup' ? (
            <>
              <p
                className="loom-body"
                style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: 'var(--loom-bone-faint)', lineHeight: 1.6 }}
              >
                Use three or four words you choose — easier to remember, harder to crack.
              </p>

              <div style={{ display: 'grid', gap: 8 }}>
                {passphraseChecks.map(({ label, valid }) => (
                  <div
                    key={label}
                    className="loom-mono"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}
                  >
                    <span
                      aria-hidden
                      style={{
                        color: valid ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                        transition: 'color var(--loom-dur-fast) var(--loom-ease)',
                      }}
                    >
                      {valid ? '∞' : '·'}
                    </span>
                    <span style={{ color: valid ? 'var(--loom-bone-dim)' : 'var(--loom-bone-faint)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="thread-confirm" style={labelStyle}>
                  Repeat it
                </label>
                <input
                  id="thread-confirm"
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="the same passphrase"
                  style={{
                    ...inputStyle,
                    borderColor:
                      confirmPassphrase && passphrase !== confirmPassphrase
                        ? 'var(--loom-rule-warm)'
                        : 'var(--loom-rule)',
                  }}
                />
                {confirmPassphrase && passphrase !== confirmPassphrase ? (
                  <p
                    className="loom-body"
                    style={{ margin: '8px 0 0', fontSize: 12.5, fontStyle: 'italic', color: 'var(--loom-warm)' }}
                  >
                    The two passphrases do not match.
                  </p>
                ) : null}
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  background: 'var(--loom-ink)',
                  border: '1px solid var(--loom-rule-warm)',
                  borderRadius: 2,
                }}
              >
                <p
                  className="loom-body"
                  style={{ fontSize: 12.5, color: 'var(--loom-bone-dim)', lineHeight: 1.6, margin: 0 }}
                >
                  <strong style={{ color: 'var(--loom-warm)', fontWeight: 600 }}>Write it down.</strong> Store
                  it somewhere safe. If it is lost, your encrypted entries cannot be recovered.
                </p>
              </div>
            </>
          ) : null}

          <button
            type="submit"
            disabled={isLoading || (mode === 'setup' && (!isPassphraseValid || passphrase !== confirmPassphrase))}
            className="loom-btn"
            style={{
              width: '100%',
              marginTop: 6,
              opacity:
                isLoading || (mode === 'setup' && (!isPassphraseValid || passphrase !== confirmPassphrase))
                  ? 0.5
                  : 1,
            }}
          >
            {isLoading
              ? mode === 'setup'
                ? 'sealing…'
                : 'unlocking…'
              : mode === 'setup'
                ? 'seal the thread'
                : 'unlock'}
          </button>

          {mode === 'setup' && onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="loom-mono"
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                padding: '8px 0',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--loom-bone-faint)',
              }}
            >
              seal it later
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
