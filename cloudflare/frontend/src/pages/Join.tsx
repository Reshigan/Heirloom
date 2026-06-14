import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
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
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear navigate timer on unmount
  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current);
    };
  }, []);

  // If already logged in, accept immediately
  useEffect(() => {
    if (!user || !code || done) return;
    setAccepting(true);
    engagementApi.acceptFamilyInvite(code)
      .then(() => { setDone(true); navigateTimer.current = setTimeout(() => navigate('/loom'), 1400); })
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

  const isValid = /^INV-[0-9A-F]{8}$/.test(code.toUpperCase());

  return (
    <ClothShell
      topbarLeft={<Link to="/" style={{ textDecoration: 'none' }}><HLogo size={18} wordmark /></Link>}
      topbarRight={!user ? (
        <Link
          to="/login"
          className="hl-mono"
          style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none' }}
        >
          sign in
        </Link>
      ) : undefined}
    >
      {/* body */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100%',
        }}
      >
      <div
        style={{
          maxWidth: 'var(--page-max-focus)',
          width: '100%',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {!isValid ? (
          <>
            <p className="hl-eyebrow" style={{ color: 'var(--danger)', marginBottom: 16 }}>invalid link</p>
            <h1 className="hl-serif hl-tight" style={{ fontSize: 'var(--type-title)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px' }}>
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
            <h1 className="hl-serif hl-tight" style={{ fontSize: 'var(--type-title)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px' }}>
              You've joined the family cloth.
            </h1>
            <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', lineHeight: 1.7, fontWeight: 300 }}>
              Your first thread is waiting to be woven.
            </p>
          </>
        ) : error ? (
          <>
            <p className="hl-eyebrow" style={{ color: 'var(--danger)', marginBottom: 16 }}>something went wrong</p>
            <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', lineHeight: 1.7, fontWeight: 300, margin: '0 0 24px' }}>{error}</p>
            <Link to="/loom" className="hl-link warm" style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>go to heirloom →</Link>
          </>
        ) : (
          <>
            <p className="hl-eyebrow" style={{ color: 'var(--warm)', marginBottom: 16 }}>you've been included</p>
            <h1 className="hl-serif hl-tight" style={{ fontSize: 'var(--type-title)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 20px', letterSpacing: '-0.016em', lineHeight: 1.2 }}>
              Your thread is waiting for your voice.
            </h1>
            <p className="hl-serif" style={{ fontSize: 15, color: 'var(--bone-dim)', lineHeight: 1.7, fontWeight: 300, margin: '0 0 8px' }}>
              Someone in your family has woven a permanent record of memories, letters, and stories — owned by your bloodline, not a platform. You've been included. Add your voice, or simply read what has been written.
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
    </ClothShell>
  );
}
