import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { RoomHeader, RoomSection } from '../loom/components/room';

export function BookPage() {
  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'the book' }]} />} topbarCenter="the book" topbarRight={<UserMenu />}>
      <div style={{
        padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        maxWidth: 'var(--page-max-wide)',
        margin: '0 auto',
      }}>

        {/* Header */}
        <RoomHeader
          warmEyebrow
          eyebrow="proof of permanence"
          title={<>The cloth, printed.<br />Something they can hold.</>}
          lede="Every memory, letter, and voice your family has woven — bound in cloth, printed on archival paper. A physical record that will still exist long after every server is gone."
        />

        {/* Three pillars */}
        <RoomSection label="why it lasts">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 0,
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
        </RoomSection>

        {/* What goes inside */}
        <RoomSection label="what goes inside">
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
                padding: '18px 0',
                borderBottom: '1px solid var(--rule)',
                alignItems: 'baseline',
              }}>
                <div className="hl-mono" style={{
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  color: 'var(--warm)',
                  flexShrink: 0,
                  minWidth: 44,
                }}>
                  {String((i + 1) * 4).padStart(3, '0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="hl-serif" style={{
                    fontSize: 17,
                    fontWeight: 200,
                    color: 'var(--bone)',
                    lineHeight: 1.3,
                    margin: '0 0 4px',
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
              </div>
            ))}
          </div>
        </RoomSection>

        {/* CTA — the single warm action */}
        <RoomSection>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/book-builder" className="hl-btn">
              Build your book →
            </Link>
            <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
              from your existing entries
            </span>
          </div>
        </RoomSection>

      </div>
    </ClothShell>
  );
}
