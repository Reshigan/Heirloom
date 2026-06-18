import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { ProgressHair } from '../loom/components/ProgressHair';
import { engagementApi } from '../services/api';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

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
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
          }}
        >
          sign in
        </Link>
      ) : undefined}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100%',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>

          {!isValid ? (
            /* ── Invalid invite link ── */
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--copper-label)',
                  margin: '0 0 24px',
                }}
              >
                invalid link
              </p>
              <h1
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontSize: 'clamp(40px,9vw,72px)',
                  fontWeight: 500,
                  lineHeight: 1.05,
                  color: 'var(--bone)',
                  margin: '0 0 28px',
                }}
              >
                This invite link is not valid.
              </h1>
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: 'var(--bone-dim)',
                  margin: '0 0 40px',
                  maxWidth: '38ch',
                  marginInline: 'auto',
                }}
              >
                The link may have expired or been miscopied. Ask the person who invited you to resend.
              </p>
              <Link
                to="/"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--gold-text)',
                  textDecoration: 'none',
                }}
              >
                ← home
              </Link>
              <div style={{ marginTop: 72, display: 'flex', justifyContent: 'center' }}>
                <WaxSeal size={28} />
              </div>
            </div>

          ) : accepting ? (
            /* ── Accepting / loading ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 120, margin: '0 auto' }}>
                <ProgressHair label="joining…" width={120} />
              </div>
            </div>

          ) : done ? (
            /* ── Success ── */
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--copper-label)',
                  margin: '0 0 24px',
                }}
              >
                welcome to the thread
              </p>
              <h1
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontSize: 'clamp(40px,9vw,72px)',
                  fontWeight: 500,
                  lineHeight: 1.05,
                  color: 'var(--bone)',
                  margin: '0 0 28px',
                }}
              >
                You've joined the family cloth.
              </h1>
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: 'var(--bone-dim)',
                  maxWidth: '38ch',
                  marginInline: 'auto',
                  margin: '0 auto 64px',
                }}
              >
                Your first thread is waiting to be woven.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <WaxSeal size={28} />
              </div>
            </div>

          ) : error ? (
            /* ── Error ── */
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--copper-label)',
                  margin: '0 0 24px',
                }}
              >
                something went wrong
              </p>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  color: 'var(--muted-2)',
                  margin: '0 0 40px',
                  maxWidth: '40ch',
                  marginInline: 'auto',
                  lineHeight: 1.6,
                }}
              >
                {error}
              </p>
              <Link
                to="/loom"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--gold-text)',
                  textDecoration: 'none',
                }}
              >
                go to heirloom →
              </Link>
              <div style={{ marginTop: 72, display: 'flex', justifyContent: 'center' }}>
                <WaxSeal size={28} />
              </div>
            </div>

          ) : (
            /* ── Default: not logged in, valid invite ── */
            <div style={{ textAlign: 'center' }}>
              {/* Glowing ∞ */}
              <div
                aria-hidden
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontSize: 'clamp(40px,10vw,64px)',
                  fontWeight: 300,
                  color: 'var(--ember)',
                  lineHeight: 1,
                  marginBottom: 40,
                  textShadow: '0 0 32px var(--warm-glow), 0 0 12px var(--warm-glow)',
                }}
              >
                ∞
              </div>

              {/* Mono eyebrow */}
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  margin: '0 0 24px',
                }}
              >
                welcome
              </p>

              {/* Giant serif headline */}
              <h1
                style={{
                  fontFamily: 'var(--serif-display)',
                  fontSize: 'clamp(40px,9vw,72px)',
                  fontWeight: 500,
                  lineHeight: 1.05,
                  color: 'var(--bone)',
                  margin: '0 0 28px',
                }}
              >
                Your thread is waiting for your voice.
              </h1>

              {/* Serif-italic sub */}
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: 'var(--bone-dim)',
                  maxWidth: '46ch',
                  marginInline: 'auto',
                  margin: '0 auto 36px',
                }}
              >
                Someone in your family has woven a permanent record of memories, letters, and stories — owned by your bloodline, not a platform. You've been included. Add your voice, or simply read what has been written.
              </p>

              {/* Invite code display */}
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  margin: '0 0 6px',
                }}
              >
                invite code
              </p>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  letterSpacing: '0.1em',
                  color: 'var(--bone)',
                  margin: '0 0 40px',
                }}
              >
                {code}
              </p>

              {/* CTAs */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                }}
              >
                <button
                  type="button"
                  onClick={() => storeAndGo('/signup')}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: 'var(--gold-text)',
                    background: 'transparent',
                    border: 0,
                    padding: '14px 0',
                    minHeight: 44,
                    cursor: 'pointer',
                  }}
                >
                  create account →
                </button>
                <button
                  type="button"
                  onClick={() => storeAndGo('/login')}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    background: 'transparent',
                    border: 0,
                    padding: '12px 0',
                    minHeight: 44,
                    cursor: 'pointer',
                  }}
                >
                  already have an account → sign in
                </button>
              </div>

              <div style={{ marginTop: 72, display: 'flex', justifyContent: 'center' }}>
                <WaxSeal size={28} />
              </div>
            </div>
          )}

        </div>
      </div>
    </ClothShell>
  );
}
