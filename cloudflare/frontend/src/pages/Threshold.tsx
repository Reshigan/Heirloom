import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { Loom } from '../loom/components/Loom';
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
          padding: 'clamp(24px, 5vh, 40px) clamp(20px, 8vw, 120px)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            width: '100%',
            maxWidth: 880,
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(8px)',
            transition:
              'opacity 1400ms cubic-bezier(0.16,1,0.3,1), transform 1400ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div className="loom-eyebrow" style={{ marginBottom: 32 }}>
            a perpetual family loom · est. 2026
          </div>
          <div className="loom-display" style={{ fontSize: 'clamp(48px, 12vw, 96px)', marginBottom: 28 }}>
            Heirloom
          </div>
          <div
            className="loom-serif"
            style={{
              fontVariationSettings: "'opsz' 20",
              fontStyle: 'italic',
              fontSize: 22,
              color: 'var(--bone-dim)',
              maxWidth: 640,
              margin: '0 auto',
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            Every life is a single thread.
            <br />
            Yours runs through the ones before you,
            <br />
            and into the ones who come after.
          </div>

          {/* a fragment of weft as the brand's signature device */}
          <div
            style={{
              maxWidth: 720,
              margin: '44px auto 0',
              opacity: revealed ? 1 : 0,
              transition: 'opacity 1400ms cubic-bezier(0.16,1,0.3,1)',
              transitionDelay: '720ms',
            }}
          >
            <Loom
              entries={[
                { year: 1958, month: 4, lane: 1, kind: 'letter' },
                { year: 1962, month: 7, lane: 2, kind: 'photo' },
                { year: 1971, month: 1, lane: 3, kind: 'voice' },
                { year: 1979, month: 9, lane: 0, kind: 'milestone' },
                { year: 1984, month: 6, lane: 2, kind: 'letter' },
                { year: 1991, month: 11, lane: 1, kind: 'photo' },
                { year: 1998, month: 3, lane: 4, kind: 'letter' },
                { year: 2004, month: 8, lane: 2, kind: 'memory' },
                { year: 2011, month: 2, lane: 1, kind: 'voice' },
                { year: 2018, month: 10, lane: 3, kind: 'photo' },
                { year: 2024, month: 5, lane: 2, kind: 'letter' },
                { year: 2026, month: 3, lane: 0, kind: 'milestone' },
                { year: 2031, month: 6, lane: 2, kind: 'letter', locked: true },
                { year: 2042, month: 1, lane: 3, kind: 'letter', locked: true },
                { year: 2058, month: 11, lane: 1, kind: 'letter', locked: true },
              ]}
              ligatures={[
                { from: 0, to: 6, show: revealed },
                { from: 2, to: 8, show: revealed },
                { from: 4, to: 10, show: revealed },
                { from: 7, to: 13, show: revealed },
              ]}
              startYear={1955}
              endYear={2065}
              height={140}
            />
          </div>

          <div
            className="loom-eyebrow"
            style={{ marginTop: 60, opacity: 0.7, display: 'flex', justifyContent: 'center', gap: 24 }}
          >
            <Link to={isAuthenticated ? '/loom/weft' : '/login?redirect=/loom/weft'} className="loom-btn" style={{ textDecoration: 'none' }}>
              walk the loom
            </Link>
            <Link to="/loom/marketing" className="loom-btn-ghost" style={{ textDecoration: 'none' }}>
              read the thesis
            </Link>
          </div>
        </div>
      </div>
    </ClothShell>
  );
}
