import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, WaxSeal } from '../loom/cosmic/CosmicUI';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendFlash, setResendFlash] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setResendFlash(true);
      setTimeout(() => setResendFlash(false), 2500);
    } catch (err: any) {
      const msg: string = err?.response?.data?.error ?? '';
      if (!msg.toLowerCase().includes('already')) {
        setError(msg || 'Could not resend. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClothShell
      topbarLeft={<HLogo href="/" />}
      topbarCenter="forgot password"
      topbarRight={
        <Link
          to="/login"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
          }}
        >
          sign in →
        </Link>
      }
    >
      {/* FORM archetype: centered column, vast air, underline-only inputs */}
      <div
        style={{
          position: 'relative',
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px 120px',
        }}
      >
        {/* Deep-water legibility veil behind the form (see .auth-scrim, globals.css) */}
        <div aria-hidden className="auth-scrim" />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360 }}>
          {success ? (
            /* ── Success branch ── */
            <div role="status" style={{ textAlign: 'center' }}>
              <CosmicHeader
                eyebrow="reset link sent"
                title="Check your inbox."
                sub={
                  <>
                    If a thread exists for{' '}
                    <span style={{ color: 'var(--gold-text)', fontStyle: 'normal' }}>{email}</span>
                    , a reset link will arrive shortly.
                  </>
                }
                align="center"
              />

              <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                {resendFlash ? (
                  <p
                    role="status"
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--warm)',
                      margin: 0,
                    }}
                  >
                    sent again
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '12px 0',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-faint)',
                      opacity: isLoading ? 0.4 : 1,
                      transition: 'opacity 180ms var(--ease)',
                      minHeight: 44,
                    }}
                  >
                    didn't get it? resend →
                  </button>
                )}

                <Link
                  to="/login"
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-dim)',
                    textDecoration: 'none',
                    padding: '12px 0',
                    minHeight: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  ← back to sign in
                </Link>
              </div>

              <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center' }}>
                <WaxSeal />
              </div>
            </div>
          ) : (
            /* ── Form branch ── */
            <>
              <CosmicHeader
                eyebrow="password reset"
                title={
                  <span style={{ fontSize: 'clamp(40px,9vw,72px)', lineHeight: 1.05 }}>
                    Reset your password.
                  </span>
                }
                sub="We'll email you a reset link."
                align="center"
              />

              <form onSubmit={handleSubmit} style={{ marginTop: 40 }}>
                <label
                  htmlFor="fp-email"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                  }}
                >
                  email
                </label>
                <input
                  id="fp-email"
                  type="email"
                  className="hl-input"
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid var(--rule)',
                    outline: 'none',
                    color: 'var(--bone)',
                    caretColor: 'var(--warm)',
                    fontSize: 18,
                    padding: '10px 0 12px',
                    marginBottom: 32,
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    transition: 'border-color 180ms var(--ease)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
                />

                {error ? (
                  <p
                    role="alert"
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      letterSpacing: '0.04em',
                      color: 'var(--warm)',
                      margin: '0 0 20px',
                      textAlign: 'center',
                    }}
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '14px 0',
                    minHeight: 44,
                    cursor: isLoading || !email.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                    opacity: isLoading || !email.trim() ? 0.4 : 1,
                    transition: 'opacity 180ms var(--ease)',
                    textAlign: 'center',
                  }}
                >
                  {isLoading ? 'sending…' : 'send reset →'}
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Link
                  to="/login"
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-dim)',
                    textDecoration: 'none',
                    padding: '12px 0',
                    minHeight: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  ← back to sign in
                </Link>
              </div>

              <div style={{ marginTop: 80, display: 'flex', justifyContent: 'center' }}>
                <WaxSeal />
              </div>
            </>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
