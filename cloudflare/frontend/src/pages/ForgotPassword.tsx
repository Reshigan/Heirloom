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
    } catch {
      // silent — already sent once
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClothShell
      topbarLeft={<HLogo />}
      topbarCenter="forgot password"
      topbarRight={<Link to="/login">sign in →</Link>}
    >
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(24px,5vw,48px)' }}>
        {success ? (
          <div role="status">
            <h1
              className="hl-serif"
              style={{
                fontSize: 36,
                fontWeight: 300,
                lineHeight: 1.1,
                letterSpacing: '-0.018em',
                color: 'var(--bone)',
                margin: '0 0 28px',
              }}
            >
              Check your inbox.
            </h1>

            <p
              className="hl-prose dark"
              style={{
                fontSize: 15,
                color: 'var(--bone-dim)',
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
            <h1
              className="hl-serif"
              style={{
                fontSize: 36,
                fontWeight: 300,
                lineHeight: 1.1,
                letterSpacing: '-0.018em',
                color: 'var(--bone)',
                margin: '0 0 28px',
              }}
            >
              Reset your password.
            </h1>

            <p
              className="hl-prose dark"
              style={{
                fontSize: 15,
                color: 'var(--bone-dim)',
                marginBottom: 28,
              }}
            >
              We'll email you a reset link.
            </p>

            <form onSubmit={handleSubmit}>
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
                className="hl-btn"
                style={{
                  opacity: isLoading || !email.trim() ? 0.5 : 1,
                }}
              >
                {isLoading ? 'sending…' : 'Send reset →'}
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
