import { Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';

export function NotFound() {
  return (
    <div
      className="hl-screen"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--ink)',
        color: 'var(--bone)',
        overflow: 'hidden',
      }}
    >
      {/* topbar */}
      <div className="hl-topbar">
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          <HLogo size={18} wordmark />
        </Link>
        <Link to="/" className="hl-link warm">
          the cloth →
        </Link>
      </div>

      {/* centred content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p
            className="hl-mono"
            style={{
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            404 · thread not found
          </p>

          <p
            className="hl-serif"
            style={{
              fontSize: 64,
              fontWeight: 300,
              letterSpacing: '-0.022em',
              color: 'var(--bone)',
              margin: '0 0 16px',
              lineHeight: 1,
            }}
          >
            ∞
          </p>

          <p
            className="hl-serif hl-italic"
            style={{
              fontSize: 17,
              color: 'var(--bone-dim)',
              margin: '0 0 28px',
            }}
          >
            This thread does not exist.
          </p>

          <Link
            to="/"
            className="hl-link warm hl-mono"
            style={{
              fontSize: 10.5,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
            }}
          >
            return to the cloth →
          </Link>
        </div>
      </div>

      <TapestryEdge />
    </div>
  );
}
