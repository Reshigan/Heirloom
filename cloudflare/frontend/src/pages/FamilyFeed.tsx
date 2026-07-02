// FamilyFeed — Loom 3 native.
// §A Tapestry-is-the-interface: hairline list of family thread additions.
// No avatars, no reactions, no social chrome.
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { engagementApi } from '../services/api';
import { CosmicHeader, EntryRow, WaxSeal } from '../loom/cosmic/CosmicUI';
import { ProgressHair } from '../loom/components/ProgressHair';
import { dyeForId } from '../loom/dye';
import type { Dye } from '../loom/dye';

interface FeedItem {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  preview: string;
  author_member_id?: string;
  author_id?: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  reactions: number;
}

const typeVerb: Record<string, string> = {
  memory: 'wove a memory',
  voice: 'recorded a voice',
  letter: 'sealed a letter',
};

// Dye is the AUTHOR's personal signal — keyed on identity, never entry type.
function itemDye(item: FeedItem): Dye {
  return dyeForId(item.author_member_id ?? item.author_id ?? item.author_name);
}

function itemTo(item: FeedItem): string {
  if (item.type === 'voice') return `/loom/voice?id=${item.id}`;
  if (item.type === 'letter') return `/loom/letter?id=${item.id}`;
  return `/loom/read?entry=${item.id}`;
}

function fmtYear(iso: string): string {
  return new Date(iso).getFullYear().toString();
}

export function FamilyFeed() {
  const navigate = useNavigate();
  const { data: feedData, isLoading, isError } = useQuery({
    queryKey: ['family-feed'],
    queryFn: () => engagementApi.getFamilyFeed().then((r) => r.data),
  });

  const items: FeedItem[] = feedData?.items || [];
  const eyebrow = items.length ? `${items.length} ENTRIES` : 'THE THREAD';

  return (
    <ClothShell
      topbarLeft={
        <Breadcrumbs
          trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'family feed' }]}
        />
      }
     
    >
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'min(100%, 720px)',
          margin: '0 auto',
        }}
      >
        <CosmicHeader
          eyebrow={eyebrow}
          title="What your family wrote."
        />

        {/* list */}
        {isError ? (
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'var(--copper-label)',
              margin: '24px 0',
            }}
          >
            could not load feed
          </p>
        ) : isLoading ? (
          <ProgressHair />
        ) : !items.length ? (
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 17,
              lineHeight: 1.6,
              color: 'var(--bone-dim)',
              textAlign: 'center',
              padding: '48px 0',
              margin: 0,
            }}
          >
            The Deep holds nothing from this week. Settle the first entry.
          </p>
        ) : (
          <div style={{ borderTop: '1px solid var(--rule)' }}>
            {items.map((item) => (
              <EntryRow
                key={item.id}
                title={item.title || (typeVerb[item.type] ?? 'added an entry')}
                sub={item.preview || undefined}
                year={fmtYear(item.created_at)}
                author={item.author_name}
                dye={itemDye(item)}
                onClick={() => navigate(itemTo(item))}
              />
            ))}
          </div>
        )}

        <div style={{ marginTop: 64 }}>
          <WaxSeal />
        </div>
      </div>
    </ClothShell>
  );
}

export default FamilyFeed;
