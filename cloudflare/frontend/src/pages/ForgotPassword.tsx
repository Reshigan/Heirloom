import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';

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
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: '68px 1fr' }}>
      <header
        style={{
          borderBottom: '1px solid var(--loom-rule)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" className="loom-mark" style={{ textDecoration: 'none' }}>
          <span className="infmark">∞</span>heirloom
        </Link>
        <Link
          to="/login"
          className="loom-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-dim)',
            textDecoration: 'none',
          }}
        >
          back to sign in
        </Link>
      </header>

      <main
        style={{
          display: 'grid',
          placeItems: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          {success ? (
            <div role="status">
              <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
                check your email
              </div>
              <h1
                className="loom-h2"
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  margin: '0 0 24px',
                }}
              >
                On its way.
              </h1>
              <p
                className="loom-body"
                style={{ fontSize: 16, color: 'var(--loom-bone-dim)', lineHeight: 1.7, margin: 0 }}
              >
                If a thread exists for{' '}
                <span style={{ color: 'var(--loom-warm)' }}>{email}</span>, a
                reset link will arrive shortly.
              </p>
              <div style={{ marginTop: 40 }}>
                <Link
                  to="/login"
                  className="loom-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--loom-bone-faint)',
                    textDecoration: 'none',
                  }}
                >
                  ← back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
                reset password
              </div>
              <h1
                className="loom-h2"
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  margin: '0 0 16px',
                }}
              >
                Forgot your password?
              </h1>
              <p
                className="loom-body"
                style={{ fontSize: 16, color: 'var(--loom-bone-dim)', lineHeight: 1.7, margin: '0 0 40px' }}
              >
                Enter your email and we'll send a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 28 }}>
                <div>
                  <label
                    htmlFor="fp-email"
                    className="loom-eyebrow"
                    style={{ display: 'block', marginBottom: 8, fontSize: 10 }}
                  >
                    email
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="loom-body"
                    style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 14, margin: 0 }}
                  >
                    {error}
                  </p>
                ) : null}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="loom-btn"
                    style={{ opacity: isLoading || !email.trim() ? 0.5 : 1 }}
                  >
                    {isLoading ? 'sending…' : 'send reset link'}
                  </button>
                </div>
              </form>

              <div style={{ marginTop: 40 }}>
                <Link
                  to="/login"
                  className="loom-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--loom-bone-faint)',
                    textDecoration: 'none',
                  }}
                >
                  ← back to sign in
                </Link>
              </div>
            </>
          )}

          <div
            className="loom-mono"
            style={{
              marginTop: 64,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              textAlign: 'center',
            }}
          >
            ∞ &nbsp; encrypted in browser · since 2026
          </div>
        </div>
      </main>
    </div>
  );
}
