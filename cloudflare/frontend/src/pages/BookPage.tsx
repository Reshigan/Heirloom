import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';

/** warm paper cream — the ONE sanctioned inversion: the physical printed sheet */
const PAPER = 'color-mix(in srgb, var(--bone) 92%, #d8c9a8)';
/** near-black warm ink for printed text on the cream sheet */
const PAGE_INK = '#1a1712';
const PAGE_INK_DIM = 'rgba(26,23,18,0.5)';
/** warm ornament tone — warm-dim, legible on light paper */
const PAGE_WARM = '#8c5a30';
/** faint center-gutter / rule on the sheet */
const PAGE_RULE = 'rgba(0,0,0,0.08)';

const PAGE_BODY: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.7,
  color: PAGE_INK,
  textAlign: 'justify',
  hyphens: 'auto',
  margin: '0 0 1.1em',
};

export function BookPage() {
  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'the book' }]} />}
      topbarCenter="the book"
      topbarRight={<UserMenu />}
    >
      <style>{`
        .hl-book-columns {
          column-count: 2;
          column-gap: 56px;
          column-rule: 1px solid ${PAGE_RULE};
        }
        /* narrow viewports: the spread folds to a single page column */
        @media (max-width: 680px) {
          .hl-book-columns { column-count: 1; column-rule: none; }
        }
      `}</style>
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
        {/* the bound sheet — cream paper, reverent on the ink surround */}
        <article
          style={{
            width: '100%',
            maxWidth: 860,
            background: PAPER,
            color: PAGE_INK,
            padding: '48px 56px',
            borderRadius: 3,
            /* the ONE allowed shadow — a subtle page-edge lift on the sheet */
            boxShadow: '0 24px 60px -32px rgba(0,0,0,0.65)',
            position: 'relative',
            transition: 'opacity 720ms var(--ease), transform 720ms var(--ease)',
          }}
        >
          {/* running head — book title · chapter year */}
          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: PAGE_INK_DIM,
              textAlign: 'center',
              marginBottom: 40,
            }}
          >
            the mercer thread · 1921
          </div>

          {/* chapter head + warm ornament — set across the full sheet */}
          <header style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1
              style={{
                fontFamily: 'var(--serif)',
                fontWeight: 400,
                fontSize: 'clamp(26px, 4vw, 38px)',
                lineHeight: 1.12,
                color: PAGE_INK,
                margin: 0,
              }}
            >
              The crossing
            </h1>
            <div
              style={{
                marginTop: 14,
                color: PAGE_WARM,
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              ∞
            </div>
          </header>

          {/* two-page column body — single column on narrow viewports */}
          <div className="hl-book-columns" style={{ textAlign: 'justify' }}>
            <p style={PAGE_BODY}>
              <span
                style={{
                  float: 'left',
                  fontFamily: 'var(--serif)',
                  fontWeight: 400,
                  fontSize: '3.2em',
                  lineHeight: 0.8,
                  color: PAGE_INK,
                  marginRight: 8,
                  marginTop: 2,
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
            <p style={PAGE_BODY}>
              Each year, the oak seemed to grow stronger, mirroring our own resilience. It became our
              gathering place, the silent witness to our lives unfolding. From childhood games to
              whispered confessions under the moonlight, the tree held all our memories within its
              ancient rings. We knew that as long as the oak stood, our family would endure — rooted
              in the earth and reaching for the sky, forever connected by the unseen threads of
              history.
            </p>
          </div>

          {/* folio — printed page number at the foot of the sheet */}
          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              color: PAGE_INK_DIM,
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            21
          </div>
        </article>

        {/* page-turn affordances — typographic, on the ink gutter outside the sheet */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: 860,
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
