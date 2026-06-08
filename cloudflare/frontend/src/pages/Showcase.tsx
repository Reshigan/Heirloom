import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { UserMenu } from '../loom/components/Frame';

// Illustrative archetypes — not real accounts.
const ARCHETYPES = [
  { label: 'A grandmother in Johannesburg, writing since 2021' },
  { label: 'Three siblings in Osaka, keeping a shared record' },
  { label: 'A family scattered across five countries, one thread' },
];

export function Showcase() {
  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      topbarCenter="showcase"
      topbarRight={<UserMenu />}
      backdropOpacity={0.2}
    >
      <div style={{ overflowY: 'auto', minHeight: '100%' }}>
        <div style={{ padding: '64px 56px 0' }}>
          <div className="hl-eyebrow" style={{ marginBottom: 24 }}>What a thread looks like</div>
          <h1 className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, margin: '0 0 16px', color: 'var(--bone)' }}>
            The pattern of a life.
          </h1>
          <p className="hl-serif" style={{ fontSize: 17, color: 'var(--bone-dim)', maxWidth: '52ch', lineHeight: 1.6, margin: '0 0 64px' }}>
            Each entry becomes a weft thread. The cloth grows denser with every year. These patterns are illustrative — generated to show the form, not real account data.
          </p>
        </div>

        {ARCHETYPES.map((archetype, fi) => (
          <div key={fi} style={{ marginBottom: 64 }}>
            <div style={{ padding: '0 56px 16px' }}>
              <span
                className="hl-serif"
                style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--bone-faint)' }}
              >
                {archetype.label}
              </span>
            </div>
            <div style={{ borderTop: '1px solid var(--rule)', margin: '0 56px' }} />
          </div>
        ))}

        <div style={{ padding: '64px 56px 96px', borderTop: '1px solid var(--rule)' }}>
          <Link to="/signup" className="hl-btn">Start your thread — free</Link>
        </div>
      </div>
    </ClothShell>
  );
}
