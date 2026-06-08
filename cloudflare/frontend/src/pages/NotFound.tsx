import { Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';
import { useAuthStore } from '../stores/authStore';
import { ClothShell } from '../loom/components/ClothShell';

export function NotFound() {
  const { isAuthenticated } = useAuthStore();
  const home = isAuthenticated ? '/loom/today' : '/';
  return (
    <ClothShell
      topbarLeft={<HLogo />}
      topbarCenter="not found"
      topbarRight={<Link to={home} className="hl-link warm">the cloth →</Link>}
    >
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'clamp(24px,5vw,48px)', textAlign: 'center' }}>
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
          to={home}
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

      <TapestryEdge />
    </ClothShell>
  );
}
