import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { useAuthStore } from '../stores/authStore';

/**
 * Screen 01 — The Threshold
 *
 * The user's first arrival. The mark, the thesis, a fragment of weft
 * that animates in beneath. From here every other screen is one click
 * deep; we do not ask for an account, we do not ask for a name. The
 * brand statement holds the page until the user is ready.
 */
export function Threshold() {
  const { isAuthenticated } = useAuthStore();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 240);
    return () => clearTimeout(t);
  }, []);

  // `/loom` is wired as "home" / "← heirloom" across the whole app — breadcrumbs,
  // back-links, post-login, post-join, post-purchase. But this screen is the
  // anonymous brand splash showing a demo family's threads, not the visitor's own.
  // Forward a signed-in visitor to their real home so every one of those links
  // lands correctly from this single guard. Anonymous visitors keep the splash.
  if (isAuthenticated) return <Navigate to="/loom/pwa" replace />;

  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      backdropOpacity={0.45}
      topbarRight={
        <Link
          to="/login"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            textDecoration: 'none',
          }}
        >
          enter →
        </Link>
      }
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          padding: 'clamp(40px, 9vh, 96px) clamp(28px, 8vw, 120px)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            width: '100%',
            maxWidth: 560,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(8px)',
            transition:
              'opacity 1400ms cubic-bezier(0.16,1,0.3,1), transform 1400ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* wordmark eyebrow */}
          <div
            className="loom-eyebrow"
            style={{ fontSize: 13, letterSpacing: '0.34em', color: 'var(--bone)' }}
          >
            The Threshold
          </div>

          {/* the single glowing mark — the only focal point */}
          <div
            aria-hidden
            style={{
              marginTop: 'clamp(48px, 11vh, 104px)',
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(96px, 26vw, 200px)',
              lineHeight: 1,
              fontWeight: 300,
              color: 'var(--warm)',
              textShadow:
                '0 0 28px var(--warm-glow), 0 0 64px var(--warm-glow)',
              opacity: revealed ? 1 : 0,
              transition: 'opacity 1400ms cubic-bezier(0.16,1,0.3,1)',
              transitionDelay: '360ms',
            }}
          >
            ∞
          </div>

          {/* the thesis */}
          <h1
            className="loom-display"
            style={{
              marginTop: 'clamp(48px, 11vh, 104px)',
              fontSize: 'clamp(32px, 7vw, 52px)',
              lineHeight: 1.18,
              fontWeight: 400,
            }}
          >
            Start your family&rsquo;s
            <br />
            thousand-year thread.
          </h1>
          <p
            className="loom-serif"
            style={{
              marginTop: 24,
              fontStyle: 'italic',
              fontSize: 17,
              fontWeight: 300,
              lineHeight: 1.6,
              color: 'var(--bone-dim)',
              maxWidth: 420,
            }}
          >
            A perpetual archive owned by a bloodline.
          </p>

          {/* a single warm entry — the ceremony */}
          <div
            style={{
              marginTop: 'clamp(56px, 12vh, 112px)',
              width: '100%',
              maxWidth: 360,
              opacity: revealed ? 1 : 0,
              transition: 'opacity 1400ms cubic-bezier(0.16,1,0.3,1)',
              transitionDelay: '720ms',
            }}
          >
            <div className="loom-eyebrow" style={{ marginBottom: 20, opacity: 0.7 }}>
              Entry &middot; Ceremony
            </div>
            <Link
              to={isAuthenticated ? '/loom/weft' : '/login?redirect=/loom/weft'}
              style={{
                display: 'block',
                width: '100%',
                padding: '18px 24px',
                background: 'var(--warm)',
                color: 'var(--ink)',
                fontFamily: 'var(--mono)',
                fontSize: 12,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                textAlign: 'center',
                textDecoration: 'none',
                border: '1px solid var(--warm)',
                transition: 'background 360ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--warm-bright)';
                e.currentTarget.style.borderColor = 'var(--warm-bright)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--warm)';
                e.currentTarget.style.borderColor = 'var(--warm)';
              }}
            >
              Enter
            </Link>
            <Link
              to="/loom/marketing"
              className="loom-eyebrow"
              style={{
                display: 'inline-block',
                marginTop: 22,
                color: 'var(--bone-faint)',
                textDecoration: 'none',
              }}
            >
              read the thesis
            </Link>
          </div>
        </div>
      </div>
    </ClothShell>
  );
}
