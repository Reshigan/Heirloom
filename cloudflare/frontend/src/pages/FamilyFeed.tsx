// FamilyFeed — Loom 3 native.
// §A Tapestry-is-the-interface: hairline list of family thread additions.
// No avatars, no reactions, no social chrome.
import { useQuery } from '@tanstack/react-query';
import { Frame } from '../loom/components/Frame';
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FamilyFeed() {
  const { data: feedData, isLoading } = useQuery({
    queryKey: ['family-feed'],
    queryFn: () => engagementApi.getFamilyFeed().then((r) => r.data),
  });

  const items: FeedItem[] = feedData?.items || [];

  return (
    <Frame left="family · this week">
      <div
        style={{
          padding: '56px 48px 80px',
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        {/* H1 */}
        <h1
          className="hl-serif"
          style={{
            fontSize: 36,
            fontWeight: 300,
            fontStyle: 'normal',
            margin: '0 0 28px',
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
        {isLoading ? (
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
                  paddingTop: 14,
                  paddingBottom: 14,
                  display: 'grid',
                  gridTemplateColumns: '14px 1fr auto',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                {/* dye swatch */}
                <span
                  aria-hidden
                  style={{
                    width: 14,
                    height: 2,
                    background: `var(--dye-${itemDye(item)})`,
                    display: 'block',
                    flexShrink: 0,
                  }}
                />

                {/* main text */}
                <p
                  className="hl-serif"
                  style={{ margin: 0, fontSize: 15.5, lineHeight: 1.35 }}
                >
                  <span
                    style={{ fontStyle: 'italic', color: 'var(--bone-dim)' }}
                  >
                    {item.author_name}
                  </span>
                  {' '}
                  <span style={{ fontStyle: 'normal', color: 'var(--bone)' }}>
                    {typeVerb[item.type] ?? 'added an entry'}
                    {item.title ? ` · ${item.title}` : ''}
                  </span>
                </p>

                {/* date */}
                <time
                  className="hl-mono"
                  dateTime={item.created_at}
                  style={{
                    fontSize: 10.5,
                    color: 'var(--bone-faint)',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtDate(item.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Frame>
  );
}

export default FamilyFeed;
