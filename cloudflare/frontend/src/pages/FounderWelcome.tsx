import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';

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
  const name = params.get('name') ?? 'Founder';

  // Pad to 4 digits: "0001", "0042", etc.
  const pledgeDisplay = rawNumber
    ? String(rawNumber).padStart(4, '0')
    : '0001';

  return (
    <div
      className="hl-screen"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {/* ── Topbar ────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 56px',
          fontFamily: 'var(--mono)',
          fontSize: '10.5px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          zIndex: 5,
        }}
      >
        {/* Left: logo + wordmark */}
        <Link
          to="/loom"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          <HLogo size={20} wordmark />
        </Link>

        {/* Center: page label */}
        <span
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            color: 'var(--bone-faint)',
          }}
        >
          welcome · founder
        </span>

        {/* Right: CTA */}
        <Link
          to="/loom"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '10.5px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            textDecoration: 'none',
          }}
        >
          begin your thread →
        </Link>
      </div>

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
          padding: '80px 56px 56px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '52ch' }}>
          {/* Logo glyph */}
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <HLogo size={56} glow />
          </div>

          {/* Eyebrow */}
          <p
            className="hl-eyebrow"
            style={{ color: 'var(--warm)', marginBottom: 18 }}
          >
            your pledge number, engraved just now
          </p>

          {/* Pledge number — the centrepiece */}
          <div
            className="hl-mono"
            style={{
              fontSize: 72,
              color: 'var(--warm)',
              letterSpacing: '0.12em',
              fontWeight: 400,
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {pledgeDisplay}
          </div>
          <div style={{ marginBottom: 22 }}>
            <span className="hl-mono" style={{ fontSize: 13, letterSpacing: '0.14em', color: 'var(--bone-faint)' }}>#{pledgeDisplay}</span>
          </div>

          {/* Heading */}
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 40,
              fontWeight: 300,
              margin: 0,
              color: 'var(--bone)',
            }}
          >
            Welcome, {name}.{' '}
            <span
              className="hl-italic"
              style={{ color: 'var(--bone-dim)', fontSize: 38 }}
            >
              You are now in the continuity record.
            </span>
          </h1>

          {/* Body prose */}
          <p
            className="hl-prose"
            style={{
              fontSize: 17,
              color: 'var(--bone-dim)',
              marginTop: 24,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Your pledge is part of the first hundred. Lifetime access.
            Your name appears in the continuity record filed with the successor
            non-profit at incorporation. We've sent your welcome letter with
            next steps and the date of your first quarterly Founder call.
          </p>

          {/* Buttons */}
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Link to="/loom" className="hl-btn" style={{ textDecoration: 'none' }}>
              Begin the thread →
            </Link>
            <span
              className="hl-mono"
              style={{
                fontSize: '10.5px',
                color: 'var(--bone-dim)',
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
          background:
            'radial-gradient(ellipse at bottom, rgba(176,122,74,0.16) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── TapestryEdge ──────────────────────────────────────────── */}
      <TapestryEdge nowFrac={0.04} />
    </div>
  );
}
