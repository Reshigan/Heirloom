import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

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
          alignItems: 'flex-start',
        }}
      >
        {/* reading column — dye margin thread (fallback to 1px --rule) */}
        <article
          style={{
            width: '100%',
            maxWidth: '62ch',
            borderLeft: '3px solid var(--warm-dim)',
            paddingLeft: 24,
            transition: 'opacity 720ms var(--ease)',
          }}
        >
          {/* running head — mono eyebrow */}
          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              marginBottom: 20,
            }}
          >
            the mercer thread · 1921
          </div>

          {/* serif headline */}
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 'clamp(30px, 6vw, 44px)',
              lineHeight: 1.1,
              color: 'var(--bone)',
              margin: '0 0 10px',
            }}
          >
            The crossing
          </h1>

          {/* mono warm subline */}
          <div
            className="hl-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              marginBottom: 40,
            }}
          >
            a story by the mercer family · 1921
          </div>

          {/* body — serif, justified, line-height 1.75, paragraph breaks preserved */}
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 18,
              lineHeight: 1.75,
              color: 'var(--bone)',
              textAlign: 'justify',
              hyphens: 'auto',
              margin: '0 0 1.2em',
            }}
          >
            <span
              style={{
                float: 'left',
                fontFamily: 'var(--serif)',
                fontWeight: 400,
                fontSize: '3.2em',
                lineHeight: 0.8,
                color: 'var(--bone)',
                marginRight: 8,
                marginTop: 6,
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
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 18,
              lineHeight: 1.75,
              color: 'var(--bone)',
              textAlign: 'justify',
              hyphens: 'auto',
              margin: '0 0 1.2em',
            }}
          >
            Each year, the oak seemed to grow stronger, mirroring our own resilience. It became our
            gathering place, the silent witness to our lives unfolding. From childhood games to
            whispered confessions under the moonlight, the tree held all our memories within its
            ancient rings. We knew that as long as the oak stood, our family would endure — rooted
            in the earth and reaching for the sky, forever connected by the unseen threads of
            history.
          </p>

          {/* folio */}
          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'var(--bone-faint)',
              marginTop: 16,
              marginBottom: 56,
            }}
          >
            21
          </div>
        </article>

        {/* page-turn affordances + build link — quiet mono below the column */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            paddingLeft: 27, /* border 3px + paddingLeft 24 */
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="hl-mono"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              padding: '8px 0',
              minHeight: 44,
              transition: 'color 180ms var(--ease)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
          >
            ‹ earlier
          </button>

          <button
            type="button"
            className="hl-mono"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              padding: '8px 0',
              minHeight: 44,
              transition: 'color 180ms var(--ease)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
          >
            later ›
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
              padding: '8px 0',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            build your book
          </Link>
        </div>

        {/* wax seal foot */}
        <div style={{ marginTop: 72, paddingLeft: 27, width: '100%', maxWidth: '62ch' }}>
          <WaxSeal size={22} />
        </div>
      </div>
    </ClothShell>
  );
}
