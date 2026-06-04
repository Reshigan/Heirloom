import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { VaultModal } from '../components/VaultModal';
import { encryptionService } from '../services/encryptionService';
import { Loom, type LoomEntry } from '../loom/components/Loom';
import { HLogo } from '../loom/components/HLogo';

// Login — Loom 3 two-column parchment layout (heirloom-auth.jsx §Login).
// Left: sign-in form on parchment. Right: specimen cloth on ink.
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
      {/* Loom 3 MktBar — parchment top strip */}
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
        {/* left: form on parchment */}
        <main style={{ display: 'grid', placeItems: 'center', padding: 'clamp(28px, 5vh, 56px) clamp(16px, 6vw, 88px)' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div className="hl-eyebrow dark" style={{ marginBottom: 18 }}>welcome back</div>
            <h1 className="hl-serif hl-tight" style={{
              fontSize: 'clamp(34px, 4.4vw, 44px)',
              fontWeight: 300, lineHeight: 1.08,
              letterSpacing: '-0.018em',
              margin: '0 0 36px', maxWidth: '14ch',
              color: 'var(--parchment-ink)',
            }}>
              Sign in{' '}
              <span className="hl-italic" style={{ color: 'var(--warm)' }}>to the cloth.</span>
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

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 26 }}>
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
                <p className="hl-italic" style={{
                  fontSize: 13.5, color: 'var(--parchment-faint)', marginTop: 14,
                  lineHeight: 1.55, fontWeight: 400,
                }}>
                  We use passphrases — three or four words you choose. Easier to remember, harder to crack.
                </p>
              </div>

              {error ? (
                <p role="alert" className="hl-italic" style={{ color: 'var(--dye-madder)', fontSize: 14, margin: 0 }}>
                  {error}
                </p>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 10 }}>
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
              marginTop: 40, paddingTop: 22,
              borderTop: '1px solid var(--parchment-rule)',
              fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
            }}>
              new here?{' '}
              <Link to="/signup" style={{ color: 'var(--warm)', textDecoration: 'none' }}>
                begin a thread →
              </Link>
            </div>
          </div>
        </main>

        {/* right: specimen cloth on ink */}
        <aside aria-hidden style={{
          background: 'var(--ink)', position: 'relative', overflow: 'hidden',
          minHeight: 360, display: 'flex', alignItems: 'center',
        }}>
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
          <div className="hl-mono" style={{
            position: 'absolute', left: 28, bottom: 28,
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}>
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
            navigate(redirectUrl || '/loom');
          }}
        />
      ) : null}
    </div>
  );
}

// Dense static specimen — no real data, same layout as the auth handoff
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
