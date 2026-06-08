import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClothShell
      topbarLeft={<HLogo />}
      topbarCenter="reset password"
      topbarRight={<Link to="/login" className="hl-mono" style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none' }}>sign in →</Link>}
    >
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(24px,5vw,48px)' }}>

        {!token ? (
          /* Invalid link state */
          <div role="status">
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 36,
                fontWeight: 300,
                margin: '0 0 28px',
                color: 'var(--bone)',
                lineHeight: 1.08,
                letterSpacing: '-0.018em',
              }}
            >
              Invalid reset link.
            </h1>
            <p
              className="hl-mono"
              style={{ fontSize: 13, color: 'var(--bone-dim)', lineHeight: 1.7, margin: '0 0 32px', letterSpacing: '0.04em' }}
            >
              This link has expired or is no longer valid.
            </p>
            <Link to="/forgot-password" className="hl-btn" style={{ textDecoration: 'none' }}>
              request a new link
            </Link>
          </div>
        ) : success ? (
          /* Success state */
          <div role="status">
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 36,
                fontWeight: 300,
                margin: '0 0 28px',
                color: 'var(--bone)',
                lineHeight: 1.08,
                letterSpacing: '-0.018em',
              }}
            >
              Password reset.
            </h1>
            <p
              className="hl-mono"
              style={{ fontSize: 13, color: 'var(--bone-dim)', lineHeight: 1.7, margin: '0 0 32px', letterSpacing: '0.04em' }}
            >
              Your thread is secured. Returning you to sign in…
            </p>
            <Link to="/login" className="hl-btn" style={{ textDecoration: 'none' }}>
              go to sign in →
            </Link>
          </div>
        ) : (
          /* Main form */
          <>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 36,
                fontWeight: 300,
                margin: '0 0 28px',
                color: 'var(--bone)',
                lineHeight: 1.08,
                letterSpacing: '-0.018em',
              }}
            >
              New password.
            </h1>

            <form onSubmit={handleSubmit} style={{ display: 'grid' }}>
              {/* Password input */}
              <div style={{ marginBottom: 18 }}>
                <label
                  htmlFor="rp-password"
                  className="hl-mono"
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 10,
                    letterSpacing: '0.32em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                  }}
                >
                  new password
                </label>
                <div style={{ borderBottom: '1px solid var(--bone)', paddingBottom: 6 }}>
                  <input
                    id="rp-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 0,
                      outline: 'none',
                      fontFamily: 'var(--serif)',
                      fontSize: 17,
                      color: 'var(--bone)',
                      padding: '6px 0',
                    }}
                  />
                </div>
                <p
                  className="hl-mono"
                  style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}
                >
                  at least 8 characters
                </p>
              </div>

              {/* Confirm input */}
              <div style={{ marginBottom: 24 }}>
                <label
                  htmlFor="rp-confirm"
                  className="hl-mono"
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 10,
                    letterSpacing: '0.32em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                  }}
                >
                  confirm password
                </label>
                <div style={{ borderBottom: '1px solid var(--bone)', paddingBottom: 6 }}>
                  <input
                    id="rp-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 0,
                      outline: 'none',
                      fontFamily: 'var(--serif)',
                      fontSize: 17,
                      color: 'var(--bone)',
                      padding: '6px 0',
                    }}
                  />
                </div>
              </div>

              {/* Error */}
              {error ? (
                <p
                  role="alert"
                  className="hl-mono"
                  style={{ fontSize: 10, color: 'var(--danger)', margin: '0 0 16px', letterSpacing: '0.06em' }}
                >
                  {error}
                </p>
              ) : null}

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !password.trim() || !confirmPassword.trim()}
                  className="hl-btn"
                  style={{ opacity: isLoading || !password.trim() || !confirmPassword.trim() ? 0.5 : 1 }}
                >
                  {isLoading ? 'setting…' : 'Set password →'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: 40, paddingTop: 22, borderTop: '1px solid var(--rule)' }}>
              <Link
                to="/login"
                className="hl-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  textDecoration: 'none',
                }}
              >
                ← back to sign in
              </Link>
            </div>
          </>
        )}

      </div>
    </ClothShell>
  );
}
