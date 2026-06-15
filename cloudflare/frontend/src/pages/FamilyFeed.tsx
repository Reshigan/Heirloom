// FamilyFeed — Loom 3 native.
// §A Tapestry-is-the-interface: hairline list of family thread additions.
// No avatars, no reactions, no social chrome.
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { engagementApi } from '../services/api';
import { RoomHeader, RoomSection, RoomRow } from '../loom/components/room';

interface FeedItem {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  preview: string;
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

// 10-stop natural-dye palette cycled by type + id hash
const dyeByType: Record<string, string> = {
  memory: 'madder',
  voice: 'woad',
  letter: 'walnut',
};

function itemDye(item: FeedItem): string {
  return dyeByType[item.type] ?? 'oakgall';
}

function itemTo(item: FeedItem): string {
  if (item.type === 'voice') return `/loom/voice?id=${item.id}`;
  if (item.type === 'letter') return `/loom/letter?id=${item.id}`;
  return `/loom/read?entry=${item.id}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FamilyFeed() {
  const { data: feedData, isLoading, isError } = useQuery({
    queryKey: ['family-feed'],
    queryFn: () => engagementApi.getFamilyFeed().then((r) => r.data),
  });

  const items: FeedItem[] = feedData?.items || [];

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'family feed' }]} />} topbarCenter="family feed" topbarRight={<UserMenu />}>
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'min(100%, 720px)',
          margin: '0 auto',
        }}
      >
        <RoomHeader eyebrow="the thread" title="What your family wrote." />

        {/* list */}
        {isError ? (
          <RoomSection flush><p style={{ color: 'var(--danger)' }}>could not load feed</p></RoomSection>
        ) : isLoading ? (
          <div className="hl-progress" style={{ margin: '28px 0' }} />
        ) : !items.length ? (
          <RoomSection flush>
            <p
              className="hl-serif hl-italic"
              style={{ padding: '8px 0', color: 'var(--bone-faint)', fontSize: 15 }}
            >
              The cloth holds nothing from this week. Weave the first entry.
            </p>
          </RoomSection>
        ) : (
          <RoomSection flush>
            {items.map((item) => (
              <RoomRow
                key={item.id}
                href={itemTo(item)}
                dye={itemDye(item)}
                title={item.title || (typeVerb[item.type] ?? 'added an entry')}
                meta={`${fmtDate(item.created_at)} · ${item.author_name}`}
              />
            ))}
          </RoomSection>
        )}
      </div>
    </ClothShell>
  );
}

export default FamilyFeed;
