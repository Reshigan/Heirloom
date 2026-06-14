import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { UserMenu } from '../loom/components/Frame';

export function Showcase() {
  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      topbarCenter="showcase"
      topbarRight={<UserMenu />}
      backdropOpacity={0.2}
    >
      <div style={{ overflowY: 'auto', minHeight: '100%' }}>
        <div
          style={{
            padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
            maxWidth: 'var(--page-max-reading)',
            margin: '0 auto',
          }}
        >
          <div className="hl-eyebrow" style={{ marginBottom: 24 }}>What a thread looks like</div>
          <h1 className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, margin: '0 0 16px', color: 'var(--bone)' }}>
            The pattern of a life.
          </h1>
          <p className="hl-serif" style={{ fontSize: 17, color: 'var(--bone-dim)', maxWidth: '52ch', lineHeight: 1.6, margin: '0 0 48px' }}>
            Each entry becomes a weft thread. The cloth grows denser with every year. These patterns are illustrative — generated to show the form, not real account data.
          </p>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/loom/pwa" className="hl-btn ghost">See the living cloth →</Link>
            <Link to="/signup" className="hl-btn">Start your thread — free</Link>
          </div>
        </div>
      </div>
    </ClothShell>
  );
}
