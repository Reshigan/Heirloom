import { useQuery } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { engagementApi } from '../services/api';

interface OnThisDayMemory {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  preview: string;
  thumbnail_url?: string;
  created_at: string;
  years_ago: number;
}

export function OnThisDay() {
  const { data, isLoading } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: () => engagementApi.getOnThisDay().then((r) => r.data),
  });

  const memories: OnThisDayMemory[] = data?.memories || [];
  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  const typeLabels: Record<string, string> = {
    memory: 'memory',
    voice: 'voice',
    letter: 'letter',
  };

  return (
    <AppFrame>
      <header style={{ marginBottom: 48, maxWidth: 640 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>On this day</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          {dateStr}.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', lineHeight: 1.6 }}
        >
          Threads woven on this date in earlier years surface here.
        </p>
      </header>

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : !memories.length ? (
        <div style={{ padding: '60px 36px', border: '1px solid var(--loom-rule)', maxWidth: 640 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Nothing yet</p>
          <h2
            className="loom-serif"
            style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px' }}
          >
            The thread remembers what you give it.
          </h2>
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-faint)', margin: 0, lineHeight: 1.7 }}>
            As you write into the thread over the years, entries woven on {dateStr} will surface here each year.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {memories.map((memory) => (
            <li
              key={memory.id}
              style={{ padding: '28px 0', borderBottom: '1px solid var(--loom-rule)' }}
            >
              <article style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 32, alignItems: 'baseline' }}>
                {/* Left: date + type */}
                <div>
                  <p
                    className="loom-mono"
                    style={{ margin: 0, fontSize: 12, color: 'var(--loom-warm)', letterSpacing: '0.06em' }}
                  >
                    {memory.years_ago === 1 ? '1 year ago' : `${memory.years_ago} years ago`}
                  </p>
                  <p
                    className="loom-mono"
                    style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
                  >
                    {new Date(memory.created_at).toLocaleDateString(undefined, { year: 'numeric' })} · {typeLabels[memory.type] || 'entry'}
                  </p>
                </div>

                {/* Right: content */}
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  {memory.thumbnail_url ? (
                    <img
                      src={memory.thumbnail_url}
                      alt=""
                      style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0, borderRadius: 0 }}
                    />
                  ) : null}
                  <div style={{ flex: 1 }}>
                    <h3
                      className="loom-serif"
                      style={{ fontSize: 20, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 8px', lineHeight: 1.25 }}
                    >
                      {memory.title}
                    </h3>
                    {memory.preview && (
                      <p
                        className="loom-body"
                        style={{
                          fontSize: 15,
                          color: 'var(--loom-bone-dim)',
                          margin: 0,
                          lineHeight: 1.7,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {memory.preview}
                      </p>
                    )}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--loom-rule)' }}>
                      <button
                        style={{
                          background: 'none',
                          border: 0,
                          padding: 0,
                          cursor: 'pointer',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'var(--loom-bone-faint)',
                          transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--loom-warm)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--loom-bone-faint)')}
                      >
                        remember →
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </AppFrame>
  );
}

export default OnThisDay;
