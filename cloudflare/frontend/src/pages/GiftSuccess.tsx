import { useSearchParams, Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';

export function GiftSuccess() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';

  return (
    <div
      className="hl-screen"
      data-gift-code={code}
      style={{ background: 'var(--parchment)', color: 'var(--ink)' }}
    >
      {/* Topbar */}
      <div className="hl-topbar">
        <HLogo size={18} />
      </div>

      {/* Centered content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 24px' }}>
          <HLogo
            size={40}
            glow
            style={{ marginBottom: 24, justifyContent: 'center' }}
          />

          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 40,
              fontWeight: 300,
              margin: '0 0 18px',
            }}
          >
            The gift is on its way.
          </h1>

          <p
            className="hl-prose"
            style={{
              fontSize: 17,
              color: 'var(--bone-dim)',
              margin: '0 0 28px',
            }}
          >
            You'll receive confirmation by email.
          </p>

          <Link
            to="/"
            className="hl-link warm hl-mono"
            style={{
              fontSize: 10.5,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              textDecoration: 'none',
            }}
          >
            return to the cloth →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default GiftSuccess;
