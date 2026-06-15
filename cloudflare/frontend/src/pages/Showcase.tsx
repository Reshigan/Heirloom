import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { RoomHeader } from '../loom/components/room';
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
          <RoomHeader
            eyebrow="what a thread looks like"
            title="The pattern of a life."
            lede="Each entry becomes a weft thread. The cloth grows denser with every year. These patterns are illustrative — generated to show the form, not real account data."
          />

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginTop: 48 }}>
            <Link to="/loom/pwa" className="hl-btn ghost">See the living cloth →</Link>
            <Link to="/signup" className="hl-btn">Start your thread — free</Link>
          </div>
        </div>
      </div>
    </ClothShell>
  );
}
