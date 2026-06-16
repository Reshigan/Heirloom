import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { RoomHeader } from '../loom/components/room';
import { UserMenu } from '../loom/components/Frame';
import { SectionLabel, EntryRow, WaxSeal } from '../loom/cosmic/CosmicUI';

/** Illustrative thread entries — not real data. */
const SAMPLE_ENTRIES = [
  { title: 'The summer we built the barn', year: '1962', author: 'Elspeth', dye: 'saffron' as const },
  { title: 'A letter from Cape Town', year: '1981', author: 'Thomas', dye: 'indigo' as const, italic: true },
  { title: 'Her recipe, in her hand', year: '1994', author: 'Miriam', dye: 'walnut' as const },
  { title: 'The night the ice storm came', year: '2007', author: 'James', dye: 'madder' as const },
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

          {/* Illustrative ledger rows */}
          <SectionLabel>a family's threads</SectionLabel>

          {SAMPLE_ENTRIES.map((e) => (
            <EntryRow
              key={e.title}
              title={e.title}
              year={e.year}
              author={e.author}
              dye={e.dye}
              italic={e.italic}
            />
          ))}

          {/* CTAs */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: 56,
            }}
          >
            <Link to="/loom/pwa" className="hl-btn ghost">See the living cloth →</Link>
            <Link to="/signup" className="hl-btn">Start your thread — free</Link>
          </div>

          {/* Foot mark */}
          <div style={{ marginTop: 72 }}>
            <WaxSeal size={28} />
          </div>
        </div>
      </div>
    </ClothShell>
  );
}
