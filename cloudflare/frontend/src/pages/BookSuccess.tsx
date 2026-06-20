import { Link, useSearchParams } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

import { EASE } from '../loom/motion';

export function BookSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session');

  // The bound volume's identity. The Stripe success redirect carries only the
  // session id today; title / volume / range are persisted server-side on the
  // book order. We read them from the URL if the worker ever forwards them, and
  // otherwise fall back to the family's working defaults so the cover always
  // reads as a finished, embossed object.
  const title = params.get('title')?.trim() || 'Our Family Thread';
  const volume = (params.get('volume')?.trim() || 'Volume One').toUpperCase();
  const range = params.get('range')?.trim() || String(new Date().getFullYear());

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'the book', to: '/book-builder' }, { label: 'ordered' }]} />} topbarRight={<UserMenu />}>
      <div
        style={{
          maxWidth: 'var(--page-max-focus)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: `hl-fadeup 720ms ${EASE} both`,
        }}
      >
        {/* Cormorant display title — hero heading, always ≥24px (clamp floor) */}
        <h1
          style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(24px,5vw,34px)',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--bone)',
            lineHeight: 1.16,
            margin: '0 0 20px',
          }}
        >
          {title}
        </h1>

        {/* Mono warm meta uppercase */}
        <p
          className="hl-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--copper-label)',
            margin: '0 0 32px',
          }}
        >
          {volume} · {range}
        </p>

        {/* Serif-italic dim byline */}
        <p
          className="hl-serif"
          style={{
            fontSize: 17,
            color: 'var(--bone-dim)',
            fontStyle: 'italic',
            margin: '0 0 52px',
            maxWidth: 380,
            lineHeight: 1.6,
          }}
        >
          Your volume is bound. We'll email you when it ships.
        </p>

        {/* Actions — mono warm primary CTA + quiet secondary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 28,
            paddingTop: 32,
            borderTop: '1px solid var(--rule)',
            width: '100%',
            maxWidth: 420,
          }}
        >
          <Link
            to="/loom/weft"
            className="hl-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              textDecoration: 'none',
              transition: `color 180ms ${EASE}`,
            }}
          >
            Back to the loom
          </Link>
          {/* Mono warm primary action — sharp-edged primary CTA */}
          <Link
            to="/book-builder"
            className="hl-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              padding: '0 22px',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--copper-border)',
              textDecoration: 'none',
              border: '1px solid var(--copper-border)',
              borderRadius: 0,
              transition: `color 180ms ${EASE}, border-color 180ms ${EASE}`,
            }}
          >
            Bind another →
          </Link>
        </div>

        {/* Session id — faint mono reference, preserved */}
        {sessionId && (
          <p
            className="hl-mono"
            style={{
              fontSize: 9,
              color: 'var(--bone-faint)',
              letterSpacing: '0.14em',
              marginTop: 40,
              opacity: 0.6,
            }}
          >
            {sessionId}
          </p>
        )}

        {/* WaxSeal foot */}
        <div style={{ marginTop: 64 }}>
          <WaxSeal size={22} />
        </div>
      </div>
    </ClothShell>
  );
}

export default BookSuccess;
