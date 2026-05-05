import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { memoriesApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

interface Memory {
  id: string;
  type: string;
  title: string;
  description?: string;
  fileUrl?: string | null;
  createdAt: string;
}

/**
 * Memories — Loom-native rewrite.
 *
 * A single reading column. Era-grouped (this year, last year, earlier).
 * Each entry is a row with the date on the left rail (mono small caps),
 * the title in Newsreader, and a one-line excerpt from the description.
 * No grid view, no filter chips — type filtering moves into a quiet
 * mono toggle row.
 */

const TYPES: { value: string | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'TEXT', label: 'Text' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'AUDIO', label: 'Audio' },
];

export function Memories() {
  const [type, setType] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['memories', type],
    queryFn: () =>
      memoriesApi
        .getAll({ type: type ?? undefined, limit: 200 })
        .then((r) => r.data)
        .catch(() => null),
  });

  const memories: Memory[] = (data?.memories ?? data ?? []) as Memory[];

  const grouped = groupByEra(memories);

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          Memories · {memories.length} {memories.length === 1 ? 'entry' : 'entries'}
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          What you've added to the thread.
        </h1>
        <p
          className="loom-body"
          style={{
            fontSize: 17,
            color: 'var(--loom-bone-dim)',
            margin: '14px 0 0',
            maxWidth: 640,
            lineHeight: 1.6,
          }}
        >
          Memories you wrote into your thread before it was a thread; carried forward and still
          readable here. New writing goes in alongside them.
        </p>
      </header>

      {/* Filter row */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          paddingBottom: 14,
          marginBottom: 32,
          borderBottom: '1px solid var(--loom-rule)',
        }}
      >
        {TYPES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setType(t.value)}
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: type === t.value ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
              borderBottom: '1px solid',
              borderColor: type === t.value ? 'var(--loom-warm)' : 'transparent',
              paddingBottom: 6,
              transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {t.label}
          </button>
        ))}
        <Link
          to="/compose"
          style={{
            marginLeft: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-warm)',
            textDecoration: 'none',
          }}
        >
          add a memory →
        </Link>
      </div>

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : memories.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: 'grid', gap: 56 }}>
          {Object.entries(grouped).map(([era, list]) => (
            <section key={era}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 18 }}>
                <span className="loom-eyebrow" style={{ fontSize: 11 }}>
                  {era}
                </span>
                <hr className="loom-hairline" style={{ flex: 1 }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {list.map((m) => (
                  <li
                    key={m.id}
                    style={{
                      padding: '20px 0',
                      borderBottom: '1px solid var(--loom-rule)',
                    }}
                  >
                    <article
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '160px 1fr',
                        gap: 32,
                        alignItems: 'baseline',
                      }}
                    >
                      <div>
                        <p
                          className="loom-mono"
                          style={{
                            margin: 0,
                            fontSize: 11,
                            letterSpacing: '0.18em',
                            color: 'var(--loom-warm)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {formatDate(m.createdAt)}
                        </p>
                        <p
                          className="loom-mono"
                          style={{
                            margin: '6px 0 0',
                            fontSize: 9,
                            letterSpacing: '0.2em',
                            color: 'var(--loom-bone-faint)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {m.type.toLowerCase()}
                        </p>
                      </div>
                      <div>
                        <h3
                          className="loom-serif"
                          style={{
                            fontSize: 22,
                            fontWeight: 300,
                            color: 'var(--loom-bone)',
                            margin: '0 0 6px',
                            lineHeight: 1.25,
                          }}
                        >
                          {m.title}
                        </h3>
                        {m.description ? (
                          <p
                            className="loom-body"
                            style={{
                              fontSize: 15,
                              color: 'var(--loom-bone-dim)',
                              margin: 0,
                              lineHeight: 1.7,
                              maxWidth: 60 + 'ch' as string,
                            }}
                          >
                            {m.description}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppFrame>
  );
}

function Empty() {
  return (
    <div
      style={{
        padding: '60px 36px',
        border: '1px solid var(--loom-rule)',
        textAlign: 'center',
      }}
    >
      <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
        Nothing yet
      </p>
      <h2
        className="loom-serif"
        style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 18px' }}
      >
        The first memory is the hardest. After it, the thread starts to write itself.
      </h2>
      <Link to="/compose" className="loom-btn" style={{ textDecoration: 'none' }}>
        write the first
      </Link>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function groupByEra(items: Memory[]): Record<string, Memory[]> {
  const now = new Date();
  const thisYear = now.getFullYear();
  const out: Record<string, Memory[]> = {
    'This year': [],
    [`${thisYear - 1}`]: [],
    'Earlier': [],
  };
  for (const m of items) {
    const d = new Date(m.createdAt);
    const y = d.getFullYear();
    if (Number.isNaN(y)) {
      out['Earlier'].push(m);
      continue;
    }
    if (y === thisYear) out['This year'].push(m);
    else if (y === thisYear - 1) out[`${thisYear - 1}`].push(m);
    else out['Earlier'].push(m);
  }
  // remove empty
  for (const key of Object.keys(out)) if (out[key].length === 0) delete out[key];
  return out;
}
