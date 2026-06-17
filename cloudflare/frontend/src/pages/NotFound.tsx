import { Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';
import { useAuthStore } from '../stores/authStore';
import { ClothShell } from '../loom/components/ClothShell';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

export function NotFound() {
  const { isAuthenticated } = useAuthStore();
  const home = isAuthenticated ? '/loom/today' : '/';
  return (
    <ClothShell
      topbarLeft={<HLogo href="/" />}
      topbarCenter="not found"
      topbarRight={<Link to={home} className="hl-link warm">the cloth →</Link>}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 'clamp(40px,8vw,96px) clamp(24px,5vw,48px)',
          textAlign: 'center',
          gap: 0,
        }}
      >
        <WaxSeal size={42} />

        <h1
          style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(26px,5vw,36px)',
            fontWeight: 500,
            color: 'var(--bone)',
            margin: '28px 0 14px',
            lineHeight: 1.1,
          }}
        >
          This thread does not exist.
        </h1>

        <p
          className="hl-serif hl-italic"
          style={{
            fontSize: 16,
            color: 'var(--bone-dim)',
            margin: '0 0 36px',
            lineHeight: 1.6,
          }}
        >
          The page you followed has come unwoven.
        </p>

        <Link
          to={home}
          className="hl-link warm hl-mono"
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          return to the cloth →
        </Link>
      </div>

      <TapestryEdge />
    </ClothShell>
  );
}
