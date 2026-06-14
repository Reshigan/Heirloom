// FamilyFeed — Loom 3 native.
// §A Tapestry-is-the-interface: hairline list of family thread additions.
// No avatars, no reactions, no social chrome.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { engagementApi } from '../services/api';

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
          maxWidth: 'var(--page-max-reading)',
          margin: '0 auto',
        }}
      >
        {/* kicker */}
        <div
          className="hl-eyebrow"
          style={{ marginBottom: 16, color: 'var(--bone-faint)', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span aria-hidden style={{ width: 6, height: 6, background: 'var(--warm)', display: 'block', flexShrink: 0 }} />
          the thread
        </div>

        {/* H1 */}
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 'var(--type-display)',
            fontWeight: 300,
            fontStyle: 'normal',
            margin: '0 0 32px',
            color: 'var(--bone)',
            lineHeight: 1.15,
          }}
        >
          What your family wrote.
        </h1>

        {/* hairline rule */}
        <hr
          className="hl-rule"
          style={{ marginBottom: 0 }}
        />

        {/* list */}
        {isError ? (
          <p style={{ color: 'var(--danger)' }}>could not load feed</p>
        ) : isLoading ? (
          <div className="hl-progress" style={{ margin: '28px 0' }} />
        ) : !items.length ? (
          <p
            className="hl-serif hl-italic"
            style={{ padding: '28px 0', color: 'var(--bone-faint)', fontSize: 15 }}
          >
            The cloth holds nothing from this week. Weave the first entry.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((item) => (
              <li
                key={item.id}
                style={{
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                <Link
                  to={itemTo(item)}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'grid',
                    gridTemplateColumns: '10px 1fr',
                    alignItems: 'baseline',
                    gap: 16,
                    paddingTop: 20,
                    paddingBottom: 20,
                  }}
                >
                  {/* dye square */}
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      background: `var(--dye-${itemDye(item)})`,
                      display: 'block',
                      flexShrink: 0,
                      transform: 'translateY(4px)',
                    }}
                  />

                  {/* title + meta */}
                  <div style={{ minWidth: 0 }}>
                    <p
                      className="hl-serif"
                      style={{ margin: 0, fontSize: 'var(--type-subhead)', fontWeight: 300, color: 'var(--bone)', lineHeight: 1.3 }}
                    >
                      {item.title || (typeVerb[item.type] ?? 'added an entry')}
                    </p>
                    <p
                      className="hl-mono"
                      style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
                    >
                      {fmtDate(item.created_at)} · {item.author_name}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ClothShell>
  );
}

export default FamilyFeed;
