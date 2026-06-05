import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { VaultModal } from '../components/VaultModal';
import { encryptionService } from '../services/encryptionService';
import { HLogo } from '../loom/components/HLogo';

const ClothCanvas3D = lazy(() =>
  import('../loom/components/ClothCanvas3D').then(m => ({ default: m.ClothCanvas3D }))
);

// Login — animated cloth weaving hero on the right, form on the left.
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
        navigate(redirectUrl || '/loom');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hl-screen parchment" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(clamp(16px, 2.5vh, 24px) + env(safe-area-inset-top, 0px)) clamp(16px, 5vw, 56px) clamp(16px, 2.5vh, 24px)',
        borderBottom: '1px solid var(--parchment-rule)',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          <HLogo size={18} wordmark mono color="var(--parchment-ink)" wordColor="var(--parchment-ink)" />
        </Link>
        <Link to="/signup" style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--parchment-dim)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          begin a thread →
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
        minHeight: 'calc(100vh - 73px)',
      }}>
        {/* Left: form */}
        <main style={{ display: 'grid', placeItems: 'center', padding: 'clamp(28px, 5vh, 56px) clamp(16px, 6vw, 88px)' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            {/* ∞ — 3D floating mark, the product's only symbol */}
            <div style={{ marginBottom: 32, lineHeight: 1 }}>
              <span
                className="hl-infinity-3d"
                style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}
                aria-hidden
              >
                ∞
              </span>
            </div>
            <div className="hl-eyebrow dark" style={{ marginBottom: 22 }}>welcome back</div>
            <h1 className="hl-serif hl-tight" style={{
              fontSize: 'clamp(40px, 5.5vw, 60px)',
              fontWeight: 300, lineHeight: 1.06,
              letterSpacing: '-0.022em',
              margin: '0 0 40px', maxWidth: '13ch',
              color: 'var(--parchment-ink)',
              fontVariationSettings: '"opsz" 40',
            }}>
              Enter{' '}
              <span className="hl-italic" style={{ color: 'var(--warm)' }}>the cloth.</span>
            </h1>

            {sessionExpired ? (
              <div style={{
                marginBottom: 28, padding: '12px 0',
                borderTop: '1px solid rgba(176,122,74,0.3)',
                borderBottom: '1px solid rgba(176,122,74,0.3)',
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--warm)',
                letterSpacing: '0.04em',
              }}>
                ∞ &nbsp; your session ended. sign in again.
              </div>
            ) : null}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 32 }}>
              <div>
                <label htmlFor="l-email" className="hl-mono" style={{
                  display: 'block', marginBottom: 6,
                  fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
                  color: 'var(--parchment-faint)',
                }}>
                  email
                </label>
                <input
                  id="l-email" type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="hl-input"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <label htmlFor="l-pw" className="hl-mono" style={{
                    fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
                    color: 'var(--parchment-faint)',
                  }}>
                    passphrase
                  </label>
                  <Link to="/forgot-password" className="hl-mono" style={{
                    fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: 'var(--parchment-faint)', textDecoration: 'none',
                  }}>
                    forgot?
                  </Link>
                </div>
                <input
                  id="l-pw" type="password" required autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="hl-input"
                />
              </div>

              {error ? (
                <p role="alert" className="hl-italic" style={{ color: 'var(--dye-madder)', fontSize: 14, margin: 0 }}>
                  {error}
                </p>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || !password.trim()}
                  className="hl-btn"
                  style={{ opacity: isLoading || !email.trim() || !password.trim() ? 0.5 : 1 }}
                >
                  {isLoading ? 'entering…' : 'Enter the cloth →'}
                </button>
              </div>
            </form>

            <div className="hl-mono" style={{
              marginTop: 48, paddingTop: 22,
              borderTop: '1px solid var(--parchment-rule)',
              fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
            }}>
              new here?{' '}
              <Link to="/signup" style={{ color: 'var(--warm)', textDecoration: 'none' }}>
                begin a thread →
              </Link>
            </div>
          </div>
        </main>

        {/* Right: 3D cloth canvas on ink */}
        <aside
          aria-hidden
          style={{
            background: '#0e0e0c',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 360,
          }}
        >
          <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: '#0e0e0c' }} />}>
            <ClothCanvas3D entries={LOGIN_3D_ENTRIES} />
          </Suspense>
          <div className="hl-mono" style={{
            position: 'absolute', left: 24, bottom: 24,
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'rgba(244,236,216,0.22)',
            pointerEvents: 'none',
          }}>
            specimen · 70 years · 4,318 entries
          </div>
        </aside>
      </div>

      {showVaultUnlock ? (
        <VaultModal
          isOpen={showVaultUnlock}
          mode="unlock"
          onComplete={() => {
            setShowVaultUnlock(false);
            navigate(redirectUrl || '/loom');
          }}
        />
      ) : null}
    </div>
  );
}

// Pre-generated 3D cloth entries — deterministic, no Math.random()
const LOGIN_DYE_KEYS = ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'] as const;
function loginHash(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const LOGIN_3D_ENTRIES = Array.from({ length: 80 }, (_, i) => ({
  date: new Date(1960 + Math.floor(loginHash(i * 17 + 1) * 70), 0, 1),
  dye: LOGIN_DYE_KEYS[i % LOGIN_DYE_KEYS.length] as typeof LOGIN_DYE_KEYS[number],
  locked: i % 4 === 0,
}));
