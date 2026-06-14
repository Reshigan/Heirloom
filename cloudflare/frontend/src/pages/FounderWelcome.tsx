import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { HLogo } from '../loom/components/HLogo';

/**
 * /founder/welcome — Loom 3 rewrite.
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
      {/* ── Centered content ──────────────────────────────────────── */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(12px)',
          transition: `opacity var(--dur-slow) var(--ease), transform var(--dur-slow) var(--ease)`,
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: 'var(--page-max-focus)',
            borderTop: '1px solid var(--rule)',
            borderBottom: '1px solid var(--rule)',
            padding: 'clamp(40px, 7vw, 72px) 0',
          }}
        >
          {/* Infinity mark */}
          <div
            aria-hidden
            className="hl-serif"
            style={{
              fontSize: 'clamp(40px, 6vw, 56px)',
              fontWeight: 200,
              color: 'var(--warm)',
              opacity: 0.7,
              lineHeight: 1,
              marginBottom: 30,
            }}
          >
            ∞
          </div>

          {/* Eyebrow */}
          <p
            className="hl-eyebrow"
            style={{ color: 'var(--bone-faint)', letterSpacing: '0.4em', marginBottom: 26 }}
          >
            welcome
          </p>

          {/* Heading */}
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 'clamp(34px, 5vw, 56px)',
              fontWeight: 200,
              margin: 0,
              color: 'var(--bone)',
            }}
          >
            Welcome, {name}. You are now in the continuity record.
          </h1>

          {/* Pledge number — the centrepiece */}
          <div
            className="hl-mono"
            style={{
              fontSize: 'clamp(48px, 7vw, 72px)',
              color: 'var(--warm)',
              letterSpacing: '0.12em',
              fontWeight: 400,
              lineHeight: 1,
              margin: '34px 0 4px',
            }}
          >
            {pledgeDisplay}
          </div>
          <div style={{ marginBottom: 28 }}>
            <span className="hl-mono" style={{ fontSize: 13, letterSpacing: '0.14em', color: 'var(--bone-faint)' }}>#{pledgeDisplay}</span>
          </div>

          {/* Body prose */}
          <p
            className="hl-serif"
            style={{
              fontSize: 'var(--type-body-lg)',
              color: 'var(--bone-dim)',
              lineHeight: 1.7,
              maxWidth: '46ch',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Your pledge is part of the first hundred. Lifetime access.
            Your name appears in the continuity record filed with the successor
            non-profit at incorporation. We've sent your welcome letter with
            next steps and the date of your first quarterly Founder call.
          </p>

          {/* CTA */}
          <div
            style={{
              marginTop: 44,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <Link to="/loom" className="hl-btn text" style={{ textDecoration: 'none', letterSpacing: '0.06em' }}>
              begin the thread →
            </Link>
            <span
              className="hl-mono"
              style={{
                fontSize: '10.5px',
                color: 'var(--bone-faint)',
                letterSpacing: '0.12em',
              }}
            >
              or come back when ready
            </span>
          </div>
        </div>
      </div>

      {/* ── Warm glow at bottom ───────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
          background: 'transparent',
          pointerEvents: 'none',
        }}
      />
    </ClothShell>
  );
}
