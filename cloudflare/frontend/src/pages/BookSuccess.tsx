import { Link, useSearchParams } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

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
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'the book', to: '/book-builder' }, { label: 'ordered' }]} />} topbarCenter="book ordered" topbarRight={<UserMenu />}>
      <div
        style={{
          maxWidth: 'var(--page-max-focus)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* The bound volume — a black-linen hardcover standing on the ink, its
            title and volume line gold-embossed into the cloth. */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(220px, 70vw, 300px)',
            aspectRatio: '5 / 7',
            background: '#14110d',
            // near-invisible linen weave — kept under the eye, never glassy
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 2px)',
            border: '1px solid rgba(176,122,74,0.25)',
            borderRadius: 2,
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            padding: '14% 12%',
            boxSizing: 'border-box',
          }}
        >
          {/* Embossed wax ∞ seal — an oval ring holding the only mark */}
          <span
            aria-hidden
            style={{
              width: 64,
              height: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--warm)',
              borderRadius: '50%',
              flex: '0 0 auto',
            }}
          >
            <span
              style={{
                fontSize: 30,
                lineHeight: 1,
                color: 'var(--warm-bright)',
                textShadow: '0 0 18px var(--warm-glow), 0 1px 0 rgba(0,0,0,0.6)',
              }}
            >
              ∞
            </span>
          </span>

          {/* Embossed title */}
          <h1
            className="hl-serif"
            style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 400,
              color: 'var(--warm-bright)',
              textShadow: '0 1px 0 rgba(0,0,0,0.6)',
              lineHeight: 1.16,
              margin: 0,
            }}
          >
            {title}
          </h1>

          {/* Volume + year range */}
          <p
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--warm-dim)',
              margin: 0,
            }}
          >
            {volume} · {range}
          </p>
        </div>

        {/* Quiet confirmation */}
        <p
          className="hl-serif"
          style={{
            fontSize: 16,
            color: 'var(--bone-dim)',
            fontStyle: 'italic',
            margin: '48px 0 0',
            maxWidth: 380,
            lineHeight: 1.6,
          }}
        >
          Your volume is bound. We'll email you when it ships.
        </p>

        {/* The volume's actions — quiet mono links, each keeping its route */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 28,
            margin: '40px auto 0',
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
          <Link
            to="/book-builder"
            className="hl-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              textDecoration: 'none',
              transition: `color 180ms ${EASE}`,
            }}
          >
            Bind another →
          </Link>
        </div>

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
      </div>
    </ClothShell>
  );
}

export default BookSuccess;
