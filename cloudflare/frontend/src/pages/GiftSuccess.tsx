import { useSearchParams, Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

export function GiftSuccess() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'gift sent' }]} />}
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
        <div
          style={{
            textAlign: 'center',
            maxWidth: 'var(--page-max-focus)',
            padding: '0 var(--page-pad-x)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {/* ponytail: hero ∞ dropped — WaxSeal foot is the single canonical ∞ mark */}
          {/* Mono warm meta — "SENT" */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              marginBottom: 20,
            }}
          >
            SENT
          </div>

          {/* Display title — Cormorant, hero only at >=24px */}
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: 'var(--bone)',
              margin: '0 0 20px',
            }}
          >
            The gift is on its way.
          </h1>

          {/* Serif-italic dim byline */}
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 17,
              lineHeight: 1.65,
              color: 'var(--bone-dim)',
              margin: '0 0 48px',
              maxWidth: '30em',
            }}
          >
            You'll receive confirmation by email.
          </p>

          {/* Mono warm CTA back to cloth */}
          <Link
            to="/loom"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              textDecoration: 'none',
              display: 'inline-block',
              minHeight: 44,
              lineHeight: '44px',
              padding: '0 4px',
              transition: 'opacity 180ms var(--ease)',
            }}
          >
            RETURN TO THE CLOTH →
          </Link>

          {/* WaxSeal foot mark */}
          <div style={{ marginTop: 64 }}>
            <WaxSeal size={28} />
          </div>
        </div>
      </div>
    </ClothShell>
  );
}

export default GiftSuccess;
