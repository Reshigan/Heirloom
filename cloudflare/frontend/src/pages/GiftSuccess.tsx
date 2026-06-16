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
          {/* Glowing warm ∞ — CEREMONY archetype mark */}
          <div
            aria-hidden
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(40px, 10vw, 64px)',
              lineHeight: 1,
              color: 'var(--warm)',
              textShadow: '0 0 32px var(--warm-glow), 0 0 12px var(--warm-glow)',
              marginBottom: 32,
            }}
          >
            ∞
          </div>

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

          {/* Serif title */}
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(24px, 5vw, 34px)',
              fontWeight: 400,
              lineHeight: 1.2,
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
