import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';

/** warm-paper page color — a muted bone, not pure white, that sits on --ink */
const PAGE = '#1a1510';
const PAGE_EDGE = 'rgba(176,122,74,0.35)';

/** one bound page in the spread */
function BookLeaf({ children, side, folio }: { children: React.ReactNode; side: 'left' | 'right'; folio?: string }) {
  return (
    <div
      style={{
        background: PAGE,
        flex: '1 1 0',
        minWidth: 0,
        padding: '54px 46px 40px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow:
          side === 'left'
            ? 'inset -18px 0 28px -20px rgba(0,0,0,0.7)'
            : 'inset 18px 0 28px -20px rgba(0,0,0,0.7)',
        borderTop: `1px solid ${PAGE_EDGE}`,
        borderBottom: `1px solid ${PAGE_EDGE}`,
        borderLeft: side === 'left' ? `1px solid ${PAGE_EDGE}` : 'none',
        borderRight: side === 'right' ? `1px solid ${PAGE_EDGE}` : 'none',
        borderRadius: side === 'left' ? '3px 0 0 3px' : '0 3px 3px 0',
      }}
    >
      {/* running header — book/family name */}
      <div
        className="hl-mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--warm-dim)',
          textAlign: side === 'left' ? 'left' : 'right',
          marginBottom: 34,
          opacity: 0.85,
        }}
      >
        the bloodline · heirloom
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      {/* folio — centered mono page number */}
      {folio && (
        <div
          className="hl-mono"
          style={{ fontSize: 11, color: 'var(--warm-dim)', textAlign: 'center', marginTop: 30 }}
        >
          {folio}
        </div>
      )}
    </div>
  );
}

const PAGE_BODY: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontWeight: 300,
  fontSize: 14.5,
  lineHeight: 1.72,
  color: 'rgba(244,236,216,0.74)',
  textAlign: 'justify',
  hyphens: 'auto',
  margin: 0,
};

export function BookPage() {
  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'the book' }]} />}
      topbarCenter="the book"
      topbarRight={<UserMenu />}
    >
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-wide)',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 26,
        }}
      >
        {/* the open spread, reverent on the ink surround */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: 820,
            alignItems: 'stretch',
            transition: 'opacity 720ms var(--ease), transform 720ms var(--ease)',
          }}
        >
          {/* left leaf — chapter opening with drop-cap */}
          <BookLeaf side="left" folio="46">
            <div
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                marginBottom: 14,
              }}
            >
              Chapter Three · The Old Oak
            </div>
            <div style={{ height: 1, background: 'var(--rule)', marginBottom: 22 }} />
            <p style={PAGE_BODY}>
              <span
                style={{
                  float: 'left',
                  fontFamily: 'var(--serif)',
                  fontWeight: 400,
                  fontSize: 56,
                  lineHeight: 0.82,
                  color: 'var(--warm)',
                  paddingRight: 8,
                  marginTop: 4,
                }}
              >
                O
              </span>
              ur family lore begins with the old oak, standing silent sentinel by the riverbend. Its
              roots run as deep as our blood, its branches reaching towards a future it could only
              dream of. We carved our names, one by one, into its rough bark — a testament to our
              presence, our belonging. The wind whispered secrets through its leaves: tales of
              laughter, of tears, and the countless seasons it had witnessed.
            </p>
          </BookLeaf>

          {/* right leaf — continuing column, folio + the only mark */}
          <BookLeaf side="right" folio="47">
            <p style={PAGE_BODY}>
              Each year, the oak seemed to grow stronger, mirroring our own resilience. It became our
              gathering place, the silent witness to our lives unfolding. From childhood games to
              whispered confessions under the moonlight, the tree held all our memories within its
              ancient rings. We knew that as long as the oak stood, our family would endure — rooted
              in the earth and reaching for the sky, forever connected by the unseen threads of
              history.
            </p>
            <div style={{ marginTop: 26, textAlign: 'center', color: 'var(--warm)', fontSize: 22, lineHeight: 1, opacity: 0.9 }}>
              ∞
            </div>
          </BookLeaf>
        </div>

        {/* page-turn affordances — typographic, not icons */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: 820,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            className="hl-mono"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              padding: '8px 4px',
              transition: 'color 180ms var(--ease)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
          >
            ‹ earlier
          </button>

          <Link
            to="/book-builder"
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--warm-dim)',
              textDecoration: 'none',
            }}
          >
            build your book
          </Link>

          <button
            type="button"
            className="hl-mono"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              padding: '8px 4px',
              transition: 'color 180ms var(--ease)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
          >
            later ›
          </button>
        </div>
      </div>
    </ClothShell>
  );
}
