import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { VaultModal } from '../components/VaultModal';
import { encryptionService } from '../services/encryptionService';

/**
 * Login — Loom-native rewrite.
 *
 * Same business logic as before (auth, vault unlock, redirect on
 * success). Cosmetic shell only: a single mark, a Newsreader heading,
 * two hairline-bordered fields, a warm primary button. No cosmic
 * intro animation, no particles, no glow.
 */
export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const redirectUrl = searchParams.get('redirect');
  const sessionExpired = searchParams.get('session_expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVaultUnlock, setShowVaultUnlock] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      const encryptionStatus = await encryptionService.getStatus();
      if (encryptionStatus.enabled && !encryptionStatus.unlocked) {
        setShowVaultUnlock(true);
      } else {
        navigate(redirectUrl || '/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Email or password is wrong.');
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
        <Link
          to="/"
          className="loom-mark"
          style={{ textDecoration: 'none' }}
        >
          <span className="infmark">∞</span>heirloom
        </Link>
        <Link
          to="/signup"
          className="loom-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-dim)',
            textDecoration: 'none',
          }}
        >
          new here? begin a thread
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
          <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
            sign in
          </div>
          <h1
            className="loom-h2"
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontStyle: 'italic',
              fontWeight: 300,
              margin: '0 0 32px',
            }}
          >
            welcome back.
          </h1>

          {sessionExpired ? (
            <div
              style={{
                marginBottom: 28,
                padding: '12px 0',
                borderTop: '1px solid var(--loom-rule-warm)',
                borderBottom: '1px solid var(--loom-rule-warm)',
              }}
              className="loom-mono"
            >
              <span style={{ fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.04em' }}>
                ∞ &nbsp; your session ended. sign in again.
              </span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 28 }}>
            <div>
              <label
                htmlFor="l-email"
                className="loom-eyebrow"
                style={{ display: 'block', marginBottom: 8, fontSize: 10 }}
              >
                email
              </label>
              <input
                id="l-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
                <label htmlFor="l-pw" className="loom-eyebrow" style={{ fontSize: 10 }}>
                  password
                </label>
                <Link
                  to="/forgot-password"
                  className="loom-mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--loom-bone-faint)',
                    textDecoration: 'none',
                  }}
                >
                  forgot?
                </Link>
              </div>
              <input
                id="l-pw"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="loom-body"
                style={{
                  fontStyle: 'italic',
                  color: '#c25a5a',
                  fontSize: 14,
                  margin: 0,
                }}
              >
                {error}
              </p>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className="loom-btn"
                style={{ opacity: isLoading || !email.trim() || !password.trim() ? 0.5 : 1 }}
              >
                {isLoading ? 'signing in…' : 'sign in'}
              </button>
            </div>
          </form>

          <div
            className="loom-mono"
            style={{
              marginTop: 48,
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

      {showVaultUnlock ? (
        <VaultModal
          isOpen={showVaultUnlock}
          mode="unlock"
          onComplete={() => {
            setShowVaultUnlock(false);
            navigate(redirectUrl || '/dashboard');
          }}
        />
      ) : null}
    </div>
  );
}
