import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { HLogo } from '../loom/components/HLogo';
import { engagementApi } from '../services/api';

const PENDING_INVITE_KEY = 'hl-pending-invite';

export function Join() {
  const [params] = useSearchParams();
  const code = params.get('code') ?? '';
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, accept immediately
  useEffect(() => {
    if (!user || !code || done) return;
    setAccepting(true);
    engagementApi.acceptFamilyInvite(code)
      .then(() => { setDone(true); setTimeout(() => navigate('/loom'), 1400); })
      .catch((err) => {
        const msg = err?.response?.data?.error ?? 'Could not accept invite.';
        // Already a member or already accepted — still send them home
        if (msg.toLowerCase().includes('already')) {
          navigate('/loom');
        } else {
          setError(msg);
          setAccepting(false);
        }
      });
  }, [user, code, done, navigate]);

  // Store code for post-signup pickup
  const storeAndGo = (to: string) => {
    if (code) localStorage.setItem(PENDING_INVITE_KEY, code);
    navigate(to);
  };

  const isValid = /^INV-[0-9A-F]{8}$/.test(code);

  return (
    <div
      className="loom"
      style={{
        minHeight: '100dvh',
        background: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* topbar */}
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          padding: '28px clamp(20px, 5vw, 56px) 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <HLogo size={18} wordmark />
        </Link>
        {!user && (
          <Link
            to="/login"
            style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-dim)', textDecoration: 'none' }}
          >
            sign in
          </Link>
        )}
      </div>

      {/* body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 480,
          width: '100%',
          padding: '40px clamp(20px, 5vw, 40px) 80px',
        }}
      >
        {!isValid ? (
          <>
            <p className="hl-eyebrow" style={{ color: 'var(--warm)', marginBottom: 16 }}>invalid link</p>
            <h1 className="hl-serif hl-tight" style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px' }}>
              This invite link is not valid.
            </h1>
            <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', lineHeight: 1.7, fontWeight: 300, margin: '0 0 32px' }}>
              The link may have expired or been miscopied. Ask the person who invited you to resend.
            </p>
            <Link to="/" className="hl-link warm" style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>← home</Link>
          </>
        ) : accepting ? (
          <>
            <div style={{ height: 1, background: 'var(--warm)', width: '32px', marginBottom: 28, opacity: 0.6 }} />
            <p className="hl-mono" style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>joining…</p>
          </>
        ) : done ? (
          <>
            <p className="hl-eyebrow" style={{ color: 'var(--warm)', marginBottom: 16 }}>welcome to the thread</p>
            <h1 className="hl-serif hl-tight" style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px' }}>
              You've joined the family cloth.
            </h1>
            <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', lineHeight: 1.7, fontWeight: 300 }}>
              Your first thread is waiting to be woven.
            </p>
          </>
        ) : error ? (
          <>
            <p className="hl-eyebrow" style={{ color: 'var(--warm)', marginBottom: 16 }}>something went wrong</p>
            <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', lineHeight: 1.7, fontWeight: 300, margin: '0 0 24px' }}>{error}</p>
            <Link to="/loom" className="hl-link warm" style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>go to heirloom →</Link>
          </>
        ) : (
          <>
            <p className="hl-eyebrow" style={{ color: 'var(--warm)', marginBottom: 16 }}>you've been invited</p>
            <h1 className="hl-serif hl-tight" style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px', letterSpacing: '-0.016em', lineHeight: 1.2 }}>
              Join your family's thousand-year thread.
            </h1>
            <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', lineHeight: 1.7, fontWeight: 300, margin: '0 0 8px' }}>
              Heirloom is a perpetual, append-only archive owned by your bloodline. Every word you write today is a permanent thread in your family's cloth.
            </p>

            <div
              style={{
                margin: '28px 0',
                padding: '12px 16px',
                border: '1px solid var(--rule)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 300, color: 'var(--warm)' }}>∞</span>
              <div>
                <div className="hl-mono" style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 2 }}>invite code</div>
                <div className="hl-mono" style={{ fontSize: 13, color: 'var(--bone)', letterSpacing: '0.1em' }}>{code}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                className="hl-btn"
                onClick={() => storeAndGo('/signup')}
                style={{ width: '100%', fontSize: 13, padding: '14px 20px' }}
              >
                create account →
              </button>
              <button
                type="button"
                onClick={() => storeAndGo('/login')}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--rule)',
                  color: 'var(--bone-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  padding: '12px 20px',
                  cursor: 'pointer',
                }}
              >
                already have an account → sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
