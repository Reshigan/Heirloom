import { useSearchParams, Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
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
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 24px' }}>
          <HLogo
            size="md"
            wordmark
          />

          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 40,
              fontWeight: 300,
              margin: '24px 0 18px',
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
            to="/loom"
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
    </ClothShell>
  );
}

export default GiftSuccess;
