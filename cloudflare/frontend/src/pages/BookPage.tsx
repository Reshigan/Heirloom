import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';

export function BookPage() {
  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'the book' }]} />} topbarCenter="the book" topbarRight={<UserMenu />}>
      <div style={{
        padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        maxWidth: 'var(--page-max-wide)',
        margin: '0 auto',
      }}>

        {/* Eyebrow */}
        <div className="hl-eyebrow" style={{ marginBottom: 20, color: 'var(--warm)' }}>
          proof of permanence
        </div>

        {/* Headline */}
        <h1 className="hl-serif hl-tight" style={{
          fontSize: 'var(--type-display)',
          fontWeight: 300,
          lineHeight: 1.08,
          margin: '0 0 24px',
          color: 'var(--bone)',
          fontVariationSettings: '"opsz" 44',
          letterSpacing: '-0.018em',
        }}>
          The cloth, printed.<br />
          Something they can hold.
        </h1>

        <p className="hl-serif" style={{
          fontSize: 'clamp(16px, 1.9vw, 20px)',
          fontWeight: 300,
          color: 'var(--bone-dim)',
          lineHeight: 1.65,
          margin: '0 0 52px',
          maxWidth: '52ch',
        }}>
          Every memory, letter, and voice your family has woven — bound in cloth, printed on archival paper.
          A physical record that will still exist long after every server is gone.
        </p>

        {/* Three pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 0,
          marginBottom: 56,
          borderTop: '1px solid var(--rule)',
        }}>
          {[
            {
              label: 'archival paper',
              body: 'Acid-free, 80-year rated. The same specification used for legal records and fine art prints.',
            },
            {
              label: 'cloth binding',
              body: 'Hardcover with natural-cloth spine. Built to sit on a shelf for a century, not a recycling bin.',
            },
            {
              label: 'lossless fidelity',
              body: 'Every thread, every dye, every entry reproduced exactly as woven. No compression, no crop.',
            },
          ].map((p, i) => (
            <div key={i} style={{
              padding: '28px 24px 28px 0',
              borderRight: i < 2 ? '1px solid var(--rule)' : 'none',
              paddingLeft: i > 0 ? 24 : 0,
            }}>
              <div className="hl-eyebrow" style={{ marginBottom: 12, color: 'var(--warm)' }}>
                {p.label}
              </div>
              <p className="hl-serif" style={{
                fontSize: 14,
                fontWeight: 300,
                color: 'var(--bone-dim)',
                lineHeight: 1.65,
                margin: 0,
              }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>

        {/* What goes inside */}
        <div style={{ marginBottom: 56 }}>
          <div className="hl-eyebrow" style={{ marginBottom: 20 }}>what goes inside</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['the cloth spread', 'Your full tapestry, printed across facing pages. Every weft thread visible.'],
              ['memories', 'Each memory as a typeset page. Source Serif. Room to breathe.'],
              ['sealed letters', 'Included as facsimiles — envelope still sealed on the page. Opened separately when the moment arrives.'],
              ['voice transcripts', 'Recordings transcribed and typeset, with the speaker\'s dye color in the margin.'],
              ['dedication', 'Your words, on the first page, to whoever will hold this.'],
            ].map(([title, desc], i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 24,
                padding: '16px 0',
                borderBottom: '1px solid var(--rule)',
              }}>
                <div className="hl-mono" style={{
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  flexShrink: 0,
                  paddingTop: 2,
                  minWidth: 120,
                }}>
                  {title}
                </div>
                <p className="hl-serif" style={{
                  fontSize: 14,
                  fontWeight: 300,
                  color: 'var(--bone-dim)',
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/book-builder" className="hl-btn">Build your book →</Link>
          <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
            from your existing entries
          </span>
        </div>

      </div>
    </ClothShell>
  );
}
