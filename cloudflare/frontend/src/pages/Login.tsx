import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { VaultModal } from '../components/VaultModal';
import { encryptionService } from '../services/encryptionService';
import { Loom, type LoomEntry } from '../loom/components/Loom';

/**
 * Login — Loom-native, two-column editorial (artboard: heirloom-auth.jsx).
 *
 * Left: the sign-in form. Right: a specimen of the cloth on ink, captioned
 * — a faithful static woven specimen built from the Loom primitive (the real
 * pan happens after signing in). Same business logic as before: auth, thread
 * unlock, redirect on success. Responsive: the specimen drops below ~900px.
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--loom-ink)',
    border: '1px solid var(--loom-rule)',
    borderRadius: 2,
    color: 'var(--loom-bone)',
    padding: '11px 14px',
    fontFamily: "'Inter', sans-serif",
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          alignItems: 'stretch',
        }}
      >
        {/* left: form */}
        <main style={{ display: 'grid', placeItems: 'center', padding: '56px 40px' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div className="loom-eyebrow" style={{ marginBottom: 22 }}>
              welcome back
            </div>
            <h1
              className="loom-h2"
              style={{
                fontSize: 'clamp(34px, 4.4vw, 48px)',
                fontWeight: 300,
                lineHeight: 1.08,
                letterSpacing: '-0.018em',
                margin: '0 0 36px',
              }}
            >
              Sign in{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--loom-warm)' }}>to the cloth.</span>
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

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 26 }}>
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
                  style={inputStyle}
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
                    passphrase
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
                  style={inputStyle}
                />
                <p
                  className="loom-body"
                  style={{
                    margin: '14px 0 0',
                    fontStyle: 'italic',
                    fontSize: 13.5,
                    color: 'var(--loom-bone-faint)',
                    lineHeight: 1.55,
                  }}
                >
                  We use passphrases — three or four words you choose. Easier to remember, harder to crack.
                </p>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="loom-body"
                  style={{ fontStyle: 'italic', color: 'var(--loom-warm)', fontSize: 14, margin: 0 }}
                >
                  {error}
                </p>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || !password.trim()}
                  className="loom-btn"
                  style={{ opacity: isLoading || !email.trim() || !password.trim() ? 0.5 : 1 }}
                >
                  {isLoading ? 'entering…' : 'Enter the cloth →'}
                </button>
              </div>
            </form>

            <div
              className="loom-mono"
              style={{
                marginTop: 40,
                paddingTop: 22,
                borderTop: '1px solid var(--loom-rule)',
                fontSize: 10.5,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--loom-bone-faint)',
              }}
            >
              new here?{' '}
              <Link to="/signup" style={{ color: 'var(--loom-warm)', textDecoration: 'none' }}>
                begin a thread →
              </Link>
            </div>
          </div>
        </main>

        {/* right: specimen cloth on ink */}
        <aside
          aria-hidden
          style={{
            background: 'var(--loom-ink)',
            borderLeft: '1px solid var(--loom-rule)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 360,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', padding: '0 8px' }}>
            <Loom
              entries={SPECIMEN_ENTRIES}
              startYear={1948}
              endYear={2026}
              height={420}
              showLigatures={false}
              showYears={false}
              ambientShuttle={false}
            />
          </div>
          <div
            className="loom-mono"
            style={{
              position: 'absolute',
              left: 28,
              bottom: 28,
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
            }}
          >
            specimen · 78 yrs · 4,318 entries · pan after signing in
          </div>
        </aside>
      </div>

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

// A faithful static woven specimen (no real data) — a dense band of picks
// across 78 years, kinds varied, a few milestones tied off warm at the edge.
const SPECIMEN_KINDS = ['memory', 'photo', 'letter', 'voice', 'memory', 'photo'] as const;
const SPECIMEN_ENTRIES: LoomEntry[] = Array.from({ length: 96 }, (_, i) => {
  const t = Math.sin(i * 12.9898) * 43758.5453;
  const r = t - Math.floor(t);
  const year = 1948 + Math.floor((i / 96) * 78);
  return {
    year,
    month: 1 + Math.floor(r * 12),
    lane: i % 5,
    kind: SPECIMEN_KINDS[i % SPECIMEN_KINDS.length],
    locked: year > 2018 && r > 0.7,
  };
});
