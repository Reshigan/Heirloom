import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  return (
    <div
      className="hl-screen parchment"
      style={{ minHeight: '100vh', position: 'relative' }}
    >
      {/* Parchment topbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 56px',
          borderBottom: '1px solid var(--parchment-rule)',
        }}
      >
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          <HLogo
            size={20}
            wordmark
            mono
            color="var(--parchment-ink)"
            wordColor="var(--parchment-ink)"
          />
        </Link>
        <Link
          to="/login"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10.5,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            textDecoration: 'none',
          }}
        >
          sign in →
        </Link>
      </div>

      {/* Centered content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px 40px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          {success ? (
            <div role="status">
              <h1
                className="hl-serif"
                style={{
                  fontSize: 36,
                  fontWeight: 300,
                  lineHeight: 1.1,
                  letterSpacing: '-0.018em',
                  color: 'var(--parchment-ink)',
                  margin: '0 0 28px',
                }}
              >
                Check your inbox.
              </h1>

              <p
                className="hl-prose dark"
                style={{
                  fontSize: 15,
                  color: 'var(--parchment-dim)',
                  marginBottom: 28,
                }}
              >
                If a thread exists for{' '}
                <span style={{ color: 'var(--warm)' }}>{email}</span>, a reset
                link will arrive shortly.
              </p>

              <Link
                to="/login"
                className="hl-mono"
                style={{
                  display: 'inline-block',
                  marginTop: 16,
                  fontSize: 10,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: 'var(--parchment-dim)',
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
                  color: 'var(--parchment-ink)',
                  margin: '0 0 28px',
                }}
              >
                Reset your password.
              </h1>

              <p
                className="hl-prose dark"
                style={{
                  fontSize: 15,
                  color: 'var(--parchment-dim)',
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
                      color: 'var(--warm)',
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
                  color: 'var(--parchment-dim)',
                  textDecoration: 'none',
                }}
              >
                ← back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
