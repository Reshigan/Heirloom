import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';

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
      topbarLeft={<HLogo />}
      topbarCenter="forgot password"
      topbarRight={<Link to="/login" className="hl-mono" style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none' }}>sign in →</Link>}
    >
      <div style={{ maxWidth: 'var(--page-max-focus)', margin: '0 auto', padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)' }}>
        <div
          aria-hidden
          className="hl-serif"
          style={{ fontSize: 'clamp(40px, 6vw, 56px)', fontWeight: 200, color: 'var(--warm)', opacity: 0.7, lineHeight: 1, marginBottom: 30 }}
        >
          ∞
        </div>
        {success ? (
          <div role="status">
            <p className="hl-eyebrow" style={{ color: 'var(--bone-faint)', letterSpacing: '0.4em', marginBottom: 24 }}>reset</p>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 'clamp(34px, 5vw, 56px)',
                fontWeight: 200,
                color: 'var(--bone)',
                margin: '0 0 28px',
              }}
            >
              Check your inbox.
            </h1>

            <p
              className="hl-serif"
              style={{
                fontSize: 'var(--type-body-lg)',
                color: 'var(--bone-dim)',
                lineHeight: 1.7,
                maxWidth: '46ch',
                marginBottom: 28,
              }}
            >
              If a thread exists for{' '}
              <span style={{ color: 'var(--warm)' }}>{email}</span>, a reset
              link will arrive shortly.
            </p>

            {resendFlash ? (
              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  margin: '0 0 16px',
                }}
              >
                sent again
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="hl-mono"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  display: 'block',
                  marginBottom: 16,
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                didn't get it? resend →
              </button>
            )}

            <Link
              to="/login"
              className="hl-mono"
              style={{
                display: 'inline-block',
                marginTop: 0,
                fontSize: 10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                textDecoration: 'none',
              }}
            >
              ← back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="hl-eyebrow" style={{ color: 'var(--bone-faint)', letterSpacing: '0.4em', marginBottom: 24 }}>reset</p>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 'clamp(34px, 5vw, 56px)',
                fontWeight: 200,
                color: 'var(--bone)',
                margin: '0 0 28px',
              }}
            >
              Reset your password.
            </h1>

            <p
              className="hl-serif"
              style={{
                fontSize: 'var(--type-body-lg)',
                color: 'var(--bone-dim)',
                lineHeight: 1.7,
                maxWidth: '46ch',
                marginBottom: 28,
              }}
            >
              We'll email you a reset link.
            </p>

            <form onSubmit={handleSubmit}>
              <label
                htmlFor="fp-email"
                className="hl-mono"
                style={{ display: 'block', marginBottom: 4, fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}
              >
                email
              </label>
              <input
                id="fp-email"
                type="email"
                required
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hl-input"
                style={{ marginBottom: 24 }}
              />

              {error ? (
                <p
                  role="alert"
                  className="hl-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--danger)',
                    margin: '0 0 16px',
                    letterSpacing: '0.04em',
                  }}
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="hl-btn text"
                style={{
                  letterSpacing: '0.06em',
                  opacity: isLoading || !email.trim() ? 0.5 : 1,
                }}
              >
                {isLoading ? 'sending…' : 'send reset →'}
              </button>
            </form>

            <Link
              to="/login"
              className="hl-mono"
              style={{
                display: 'inline-block',
                marginTop: 16,
                fontSize: 10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                textDecoration: 'none',
              }}
            >
              ← back to sign in
            </Link>
          </>
        )}
      </div>
    </ClothShell>
  );
}
