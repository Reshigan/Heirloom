import { Link, useSearchParams } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';

export function BookSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session');

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'the book', to: '/book-builder' }, { label: 'ordered' }]} />} topbarCenter="book ordered" topbarRight={<UserMenu />}>
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '96px 32px 80px',
          textAlign: 'center',
        }}
      >
        {/* The only mark */}
        <p
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 40,
            color: 'var(--warm)',
            margin: '0 0 40px',
            lineHeight: 1,
          }}
        >
          ∞
        </p>

        <h1
          className="hl-serif"
          style={{ fontSize: 36, fontWeight: 300, margin: '0 0 20px', color: 'var(--bone)', lineHeight: 1.2 }}
        >
          Your book is being printed.
        </h1>

        <p
          className="hl-serif"
          style={{
            fontSize: 16,
            color: 'var(--bone-dim)',
            fontStyle: 'italic',
            margin: '0 auto 48px',
            maxWidth: 380,
            lineHeight: 1.6,
          }}
        >
          We'll email you when it ships. The cloth, made physical.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            paddingTop: 28,
            borderTop: '1px solid var(--rule)',
          }}
        >
          <Link
            to="/loom/weft"
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              textDecoration: 'none',
            }}
          >
            Back to the loom
          </Link>
          <Link
            to="/book-builder"
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              textDecoration: 'none',
            }}
          >
            Order another →
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
