import { useSearchParams, Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';

export function GiftSuccess() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'gift sent' }]} />}
      topbarCenter="gift"
      topbarRight={<UserMenu />}
    >
      <div
        data-gift-code={code}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 'var(--page-max-focus)', padding: '0 var(--page-pad-x)' }}>
          {/* ∞ mark — faint amber */}
          <div
            className="hl-serif"
            style={{
              fontSize: 44,
              fontWeight: 200,
              lineHeight: 1,
              color: 'var(--warm)',
              opacity: 0.7,
              marginBottom: 28,
            }}
          >
            ∞
          </div>

          <p
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim)',
              margin: '0 0 22px',
            }}
          >
            gift sent
          </p>

          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 'var(--type-display)',
              fontWeight: 200,
              margin: '0 0 18px',
              color: 'var(--bone)',
            }}
          >
            The gift is on its way.
          </h1>

          <p
            className="hl-serif"
            style={{
              fontSize: 'var(--type-body)',
              color: 'var(--bone-dim)',
              lineHeight: 1.7,
              margin: '0 0 36px',
            }}
          >
            You'll receive confirmation by email.
          </p>

          <Link
            to="/loom"
            className="hl-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              textDecoration: 'none',
            }}
          >
            return to the cloth →
          </Link>
        </div>
      </div>
    </ClothShell>
  );
}

export default GiftSuccess;
