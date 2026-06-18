import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current);
    };
  }, []);

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
      navigateTimer.current = setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClothShell
      topbarLeft={<HLogo href="/" />}
      topbarCenter="reset password"
      topbarRight={
        <Link
          to="/login"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
          }}
        >
          sign in →
        </Link>
      }
    >
      {/* FORM archetype: centered column, vast air, content vertically centered */}
      <div
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px 80px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ∞ ceremony mark */}
          <div
            aria-hidden
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(40px, 9vw, 64px)',
              color: 'var(--warm)',
              lineHeight: 1,
              marginBottom: 40,
            }}
          >
            ∞
          </div>

          {!token ? (
            /* Invalid / expired link state */
            <div role="status" style={{ textAlign: 'center', width: '100%' }}>
              {/* Mono eyebrow */}
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  marginBottom: 18,
                }}
              >
                reset
              </div>

              {/* Giant serif headline */}
              <h1
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontSize: 'clamp(40px, 9vw, 72px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.012em',
                  color: 'var(--bone)',
                  fontWeight: 500,
                  margin: '0 0 20px',
                }}
              >
                Invalid reset link.
              </h1>

              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: 'var(--bone-dim)',
                  margin: '0 0 40px',
                }}
              >
                This link has expired or is no longer valid.
              </p>

              <Link
                to="/forgot-password"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  textDecoration: 'none',
                  display: 'inline-block',
                  minHeight: 44,
                  lineHeight: '44px',
                }}
              >
                request a new link →
              </Link>
            </div>

          ) : success ? (
            /* Success state */
            <div role="status" style={{ textAlign: 'center', width: '100%' }}>
              {/* Mono eyebrow */}
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  marginBottom: 18,
                }}
              >
                reset
              </div>

              {/* Giant serif headline */}
              <h1
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontSize: 'clamp(40px, 9vw, 72px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.012em',
                  color: 'var(--bone)',
                  fontWeight: 500,
                  margin: '0 0 20px',
                }}
              >
                Password reset.
              </h1>

              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: 'var(--bone-dim)',
                  margin: '0 0 40px',
                }}
              >
                Your thread is secured. Returning you to sign in…
              </p>

              <Link
                to="/login"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  textDecoration: 'none',
                  display: 'inline-block',
                  minHeight: 44,
                  lineHeight: '44px',
                }}
              >
                go to sign in →
              </Link>
            </div>

          ) : (
            /* Main form */
            <div style={{ width: '100%', textAlign: 'center' }}>
              {/* Mono eyebrow */}
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  marginBottom: 18,
                }}
              >
                password reset
              </div>

              {/* Giant serif headline */}
              <h1
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontSize: 'clamp(40px, 9vw, 72px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.012em',
                  color: 'var(--bone)',
                  fontWeight: 500,
                  margin: '0 0 12px',
                }}
              >
                New password.
              </h1>

              {/* Serif-italic sub */}
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 16,
                  color: 'var(--bone-dim)',
                  margin: '0 0 48px',
                  lineHeight: 1.5,
                }}
              >
                Choose a password for your thread.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 0, width: '100%' }}>
                {/* New password field */}
                <div style={{ marginBottom: 32 }}>
                  <label
                    htmlFor="rp-password"
                    style={{
                      display: 'block',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.32em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-faint)',
                      marginBottom: 10,
                    }}
                  >
                    new password
                  </label>
                  <input
                    id="rp-password"
                    type="password"
                    className="hl-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="at least 8 characters"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--rule)',
                      color: 'var(--bone)',
                      caretColor: 'var(--warm)',
                      fontSize: 18,
                      padding: '8px 0 10px',
                      textAlign: 'center',
                      outline: 'none',
                      transition: 'border-color 180ms var(--ease)',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
                  />
                  <p
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--bone-faint)',
                      letterSpacing: '0.06em',
                      margin: '6px 0 0',
                    }}
                  >
                    at least 8 characters
                  </p>
                </div>

                {/* Confirm password field */}
                <div style={{ marginBottom: 36 }}>
                  <label
                    htmlFor="rp-confirm"
                    style={{
                      display: 'block',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.32em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-faint)',
                      marginBottom: 10,
                    }}
                  >
                    confirm password
                  </label>
                  <input
                    id="rp-confirm"
                    type="password"
                    className="hl-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="repeat password"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--rule)',
                      color: 'var(--bone)',
                      caretColor: 'var(--warm)',
                      fontSize: 18,
                      padding: '8px 0 10px',
                      textAlign: 'center',
                      outline: 'none',
                      transition: 'border-color 180ms var(--ease)',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
                  />
                </div>

                {/* Inline error — mono warm, role=alert */}
                {error ? (
                  <p
                    role="alert"
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--warm)',
                      letterSpacing: '0.06em',
                      margin: '0 0 20px',
                    }}
                  >
                    {error}
                  </p>
                ) : null}

                {/* Submit CTA — mono uppercase warm pill */}
                <button
                  type="submit"
                  disabled={isLoading || !password.trim() || !confirmPassword.trim()}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                    background: 'transparent',
                    border: '1px solid var(--warm)',
                    borderRadius: 0,
                    padding: '12px 32px',
                    minHeight: 44,
                    cursor: isLoading || !password.trim() || !confirmPassword.trim() ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !password.trim() || !confirmPassword.trim() ? 0.4 : 1,
                    transition: 'opacity 180ms var(--ease)',
                    width: '100%',
                  }}
                >
                  {isLoading ? 'setting…' : 'set password →'}
                </button>
              </form>

              {/* Footer: back to sign in */}
              <div
                style={{
                  marginTop: 48,
                  paddingTop: 24,
                  borderTop: '1px solid var(--rule)',
                }}
              >
                <Link
                  to="/login"
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    textDecoration: 'none',
                  }}
                >
                  ← back to sign in
                </Link>
              </div>
            </div>
          )}

          {/* WaxSeal ceremony foot */}
          <div style={{ marginTop: 64 }}>
            <WaxSeal size={28} />
          </div>

        </div>
      </div>
    </ClothShell>
  );
}
