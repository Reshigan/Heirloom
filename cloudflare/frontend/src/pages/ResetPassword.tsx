import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ token: token!, password });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
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
          {!token ? (
            <div role="status">
              <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
                reset password
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
                Invalid reset link.
              </h1>
              <p
                className="loom-body"
                style={{ fontSize: 16, color: 'var(--loom-bone-dim)', lineHeight: 1.7, margin: '0 0 32px' }}
              >
                This link has expired or is no longer valid.
              </p>
              <Link to="/forgot-password" className="loom-btn" style={{ textDecoration: 'none' }}>
                request a new link
              </Link>
            </div>
          ) : success ? (
            <div role="status">
              <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
                reset password
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
                Password reset.
              </h1>
              <p
                className="loom-body"
                style={{ fontSize: 16, color: 'var(--loom-bone-dim)', lineHeight: 1.7, margin: '0 0 32px' }}
              >
                Your thread is secured. Returning you to sign in…
              </p>
              <Link to="/login" className="loom-btn" style={{ textDecoration: 'none' }}>
                go to sign in
              </Link>
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
                Choose a new password.
              </h1>
              <p
                className="loom-body"
                style={{ fontSize: 16, color: 'var(--loom-bone-dim)', lineHeight: 1.7, margin: '0 0 40px' }}
              >
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 28 }}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 8,
                    }}
                  >
                    <label htmlFor="rp-password" className="loom-eyebrow" style={{ fontSize: 10 }}>
                      new password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="loom-mono"
                      style={{
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        fontSize: 9,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--loom-bone-faint)',
                        padding: 0,
                      }}
                    >
                      {showPassword ? 'hide' : 'show'}
                    </button>
                  </div>
                  <input
                    id="rp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <p
                    className="loom-mono"
                    style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em' }}
                  >
                    at least 8 characters
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 8,
                    }}
                  >
                    <label htmlFor="rp-confirm" className="loom-eyebrow" style={{ fontSize: 10 }}>
                      confirm password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="loom-mono"
                      style={{
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        fontSize: 9,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--loom-bone-faint)',
                        padding: 0,
                      }}
                    >
                      {showConfirmPassword ? 'hide' : 'show'}
                    </button>
                  </div>
                  <input
                    id="rp-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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
                    disabled={isLoading || !password.trim() || !confirmPassword.trim()}
                    className="loom-btn"
                    style={{ opacity: isLoading || !password.trim() || !confirmPassword.trim() ? 0.5 : 1 }}
                  >
                    {isLoading ? 'resetting…' : 'reset password'}
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
