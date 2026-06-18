import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { HLogo } from '../loom/components/HLogo';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { PLAN_PRICE } from '../lib/plans';

/**
 * /founder/welcome — CEREMONY archetype.
 *
 * Reads ?pledgeNumber= and ?name= from URL params.
 * Standalone dark ink screen — no AppFrame, no polling, no ProgressHair.
 * The pledge number and name are supplied by the caller (Stripe redirect) via
 * query params; no client-side polling required at this point.
 */
export function FounderWelcome() {
  const [params] = useSearchParams();
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);

  const rawNumber = params.get('pledgeNumber');
  const name = (() => {
    try {
      return decodeURIComponent(params.get('name') ?? 'Founder');
    } catch {
      return 'Founder';
    }
  })();

  // Pad to 4 digits: "0001", "0042", etc.
  const pledgeDisplay = rawNumber
    ? String(rawNumber).padStart(4, '0')
    : '0001';

  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      topbarCenter="welcome"
      topbarRight={<UserMenu />}
    >
      {/* ── Ceremony: centered, vast air ──────────────────────────── */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(12px)',
          transition: `opacity 720ms var(--ease), transform 720ms var(--ease)`,
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          gap: 0,
        }}
      >
        {/* Woven founder mark — centered, behind the ceremony */}
        <picture style={{ display: 'contents' }}>
          <source type="image/avif" srcSet="/woven/seal.avif" />
          <source type="image/webp" srcSet="/woven/seal.webp" />
          <img
            src="/woven/seal.png"
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(320px, 56vw, 560px)',
              height: 'auto',
              opacity: 0.06,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </picture>
        {/* ── Ceremony frame ────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: 'var(--page-max-focus)',
            width: '100%',
            border: '1px solid var(--rule)',
            borderRadius: 0,
            padding: 'clamp(48px, 8vw, 80px) clamp(24px, 6vw, 64px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {/* Glowing ∞ at top — the ceremony mark */}
          <div
            aria-hidden
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(40px, 10vw, 64px)',
              color: 'var(--warm)',
              lineHeight: 1,
              marginBottom: 36,
            }}
          >
            ∞
          </div>

          {/* Serif title */}
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(24px, 5vw, 34px)',
              fontWeight: 400,
              lineHeight: 1.2,
              color: 'var(--bone)',
              margin: '0 0 24px',
              letterSpacing: '-0.01em',
            }}
          >
            Welcome, {name}. You are now in the continuity record.
          </h1>

          {/* Mono warm meta — pledge number centrepiece */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 'clamp(48px, 7vw, 72px)',
              color: 'var(--warm)',
              letterSpacing: '0.12em',
              fontWeight: 400,
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {pledgeDisplay}
          </div>

          {/* Mono warm meta — sub-label */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              opacity: 0.65,
              marginBottom: 32,
            }}
          >
            FOUNDER · #{pledgeDisplay} · {PLAN_PRICE.FOUNDER.amount} LIFETIME
          </div>

          {/* Serif-italic dim byline */}
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(15px, 2.5vw, 17px)',
              color: 'var(--bone-dim)',
              lineHeight: 1.7,
              maxWidth: '42ch',
              margin: '0 0 44px',
            }}
          >
            Your pledge is part of the first hundred. Lifetime access.
            Your name appears in the continuity record filed with the successor
            non-profit at incorporation. We've sent your welcome letter with
            next steps and the date of your first quarterly Founder call.
          </p>

          {/* Mono warm CTA into the app */}
          <Link
            to="/loom"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              textDecoration: 'none',
              padding: '14px 28px',
              border: '1px solid var(--copper-border)',
              borderRadius: 0,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'opacity 180ms var(--ease)',
              marginBottom: 20,
            }}
          >
            BEGIN THE THREAD →
          </Link>

          {/* Sub-CTA — quiet mono */}
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
            }}
          >
            or come back when ready
          </span>
        </div>

        {/* ── WaxSeal foot ──────────────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 40 }}>
          <WaxSeal size={22} />
        </div>
      </div>
    </ClothShell>
  );
}
