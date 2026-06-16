import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePageMeta } from '../lib/usePageMeta';
import { VaultModal } from '../components/VaultModal';
import { encryptionService } from '../services/encryptionService';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { ProgressHair } from '../loom/components/ProgressHair';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

// Login — a single calm centered column over the global filament backdrop.
export function Login() {
  usePageMeta('Sign in', 'Sign in to your Heirloom family thread.');
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
        navigate(redirectUrl || '/loom/pwa');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClothShell
      topbarLeft={<HLogo />}
      topbarCenter="sign in"
      topbarRight={
        <Link to="/signup" style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none' }}>
          begin a thread →
        </Link>
      }
    >
      {/* A single calm centered column — vast negative space, the global filament backdrop behind. */}
      <div style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100%',
        padding: 'clamp(40px,9vh,120px) clamp(24px,6vw,48px)',
      }}>
        <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
          {/* Mono eyebrow */}
          <div className="hl-mono" style={{
            marginBottom: 14,
            fontSize: 10, letterSpacing: '0.34em', textTransform: 'uppercase',
            color: 'var(--warm)',
          }}>
            welcome back
          </div>

          {/* Serif title — type is the hero, FORM archetype scale */}
          <h1 className="hl-serif hl-tight" style={{
            fontSize: 'clamp(40px, 9vw, 72px)',
            fontWeight: 300, lineHeight: 1.05,
            letterSpacing: '-0.022em',
            margin: sessionExpired ? '0 0 24px' : '0 0 56px',
            color: 'var(--bone)',
            fontVariationSettings: '"opsz" 40',
          }}>
            Return to the thread
          </h1>

          {sessionExpired ? (
            <div style={{
              marginBottom: 40, padding: '12px 0',
              borderTop: '1px solid var(--warm-dim)',
              borderBottom: '1px solid var(--warm-dim)',
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--warm)',
              letterSpacing: '0.04em',
            }}>
              ∞ &nbsp; your session ended. sign in again.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 34, textAlign: 'left' }}>
            <div>
              <label htmlFor="l-email" className="hl-mono" style={{
                display: 'block', marginBottom: 8,
                fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
                color: 'var(--bone-faint)',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <label htmlFor="l-pw" className="hl-mono" style={{
                  fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                }}>
                  password
                </label>
                <Link to="/forgot-password" className="hl-mono" style={{
                  fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'var(--bone-dim)', textDecoration: 'none',
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
              <p role="alert" className="hl-mono" style={{
                color: 'var(--warm)', fontSize: 11,
                letterSpacing: '0.08em', margin: 0,
              }}>
                {error}
              </p>
            ) : null}

            {/* Outlined amber pill — the single accent */}
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              style={{
                width: '100%', marginTop: 14,
                padding: '13px 24px',
                background: 'transparent',
                border: '1px solid var(--warm)',
                borderRadius: 999,
                color: 'var(--warm)',
                fontFamily: 'var(--mono)',
                fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase',
                cursor: isLoading || !email.trim() || !password.trim() ? 'default' : 'pointer',
                opacity: isLoading || !email.trim() || !password.trim() ? 0.45 : 1,
                transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1), border-color 360ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              enter
            </button>

            {isLoading ? (
              <ProgressHair label="entering…" />
            ) : null}
          </form>

          {/* Quiet secondary link */}
          <div className="hl-mono" style={{
            marginTop: 56,
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}>
            no thread yet?&nbsp;·&nbsp;
            <Link to="/signup" style={{ color: 'var(--bone-dim)', textDecoration: 'none' }}>
              start one
            </Link>
          </div>

          {/* WaxSeal — ceremony foot per FORM archetype */}
          <div style={{ marginTop: 72 }}>
            <WaxSeal size={28} />
          </div>
        </div>
      </div>

      {showVaultUnlock ? (
        <VaultModal
          isOpen={showVaultUnlock}
          mode="unlock"
          onComplete={() => {
            setShowVaultUnlock(false);
            navigate(redirectUrl || '/loom/pwa');
          }}
        />
      ) : null}
    </ClothShell>
  );
}

