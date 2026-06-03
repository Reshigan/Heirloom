import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { searchApi } from '../services/api';

type ResultType = 'memory' | 'voice' | 'letter';
const TYPE_LABEL: Record<ResultType, string> = {
  memory: 'memory',
  voice: 'voice',
  letter: 'letter',
};
const TYPE_ROUTE: Record<ResultType, (id: string) => string> = {
  memory: (id) => `/memories/${id}`,
  voice:  (id) => `/voice/${id}`,
  letter: (id) => `/letters/${id}`,
};

export function QA() {
  const [query, setQuery]     = useState('');
  const [submitted, setSubmitted] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'memories' | 'voice' | 'letters'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['search', submitted, typeFilter],
    queryFn: () =>
      searchApi.search(submitted, typeFilter, 30).then(r => r.data),
    enabled: submitted.length >= 2,
    staleTime: 30_000,
  });

  const results: any[] = data?.results ?? [];
  const total: number  = data?.total ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) setSubmitted(query.trim());
  }

  return (
    <AppFrame left="search the thread">
      <div style={{ maxWidth: 680, padding: '48px 0' }}>

        {/* Headline */}
        <p className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--bone-dim)', marginBottom: 20 }}>
          search your thread
        </p>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 32, fontWeight: 300, color: 'var(--bone)', margin: '0 0 32px', letterSpacing: '-0.018em' }}>
          Find anything in your family's thread.
        </h1>

        {/* Search bar */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="search memories, voice, letters…"
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid var(--rule)',
                borderRight: 'none',
                padding: '12px 16px',
                fontFamily: 'var(--serif)',
                fontSize: 16,
                color: 'var(--bone)',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={query.trim().length < 2}
              className="hl-mono"
              style={{
                background: query.trim().length >= 2 ? 'var(--warm)' : 'transparent',
                color: query.trim().length >= 2 ? 'var(--ink)' : 'var(--bone-faint)',
                border: '1px solid var(--rule)',
                padding: '12px 20px',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: query.trim().length >= 2 ? 'pointer' : 'default',
                transition: 'background 180ms var(--ease), color 180ms var(--ease)',
                flexShrink: 0,
              }}
            >
              search
            </button>
          </div>
        </form>

        {/* Type filter — only show after first search */}
        {submitted && (
          <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
            {(['all', 'memories', 'voice', 'letters'] as const).map((t, i) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="hl-mono"
                style={{
                  background: typeFilter === t ? 'var(--ink)' : 'transparent',
                  color: typeFilter === t ? 'var(--warm)' : 'var(--bone-faint)',
                  border: '1px solid var(--rule)',
                  borderLeft: i === 0 ? '1px solid var(--rule)' : 'none',
                  padding: '6px 14px',
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'color 180ms var(--ease)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isFetching && (
          <div style={{ height: 1, background: 'var(--rule)', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%', width: '40%',
              background: 'var(--warm)',
              animation: 'hl-scan 1.4s cubic-bezier(0.16,1,0.3,1) infinite',
            }} />
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--danger)', fontSize: 14 }}>
            Search failed. Please try again.
          </p>
        )}

        {/* No results */}
        {submitted && !isFetching && !isError && results.length === 0 && (
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 28 }}>
            <p className="hl-serif" style={{ fontStyle: 'italic', color: 'var(--bone-dim)', fontSize: 16, margin: 0 }}>
              Nothing found for &ldquo;{submitted}&rdquo;.
            </p>
            <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 8, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              try a different word or check your spelling
            </p>
          </div>
        )}

        {/* Result count */}
        {submitted && !isFetching && results.length > 0 && (
          <p className="hl-mono" style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 20 }}>
            {total} result{total !== 1 ? 's' : ''} for &ldquo;{submitted}&rdquo;
          </p>
        )}

        {/* Results list */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {results.map((r: any) => (
              <Link
                key={r.id}
                to={TYPE_ROUTE[r.type as ResultType]?.(r.id) ?? '/memories'}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '18px 0',
                  borderBottom: '1px solid var(--rule)',
                  transition: 'opacity 180ms var(--ease)',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                  <span
                    className="hl-mono"
                    style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--warm)', flexShrink: 0 }}
                  >
                    {TYPE_LABEL[r.type as ResultType] ?? r.type}
                  </span>
                  <span
                    className="hl-serif"
                    style={{ fontSize: 16, color: 'var(--bone)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {r.title || 'Untitled'}
                  </span>
                </div>
                {r.snippet && (
                  <p
                    className="hl-serif"
                    style={{
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: 'var(--bone-dim)',
                      margin: 0,
                      lineHeight: 1.6,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {highlightMatch(r.snippet, submitted)}
                  </p>
                )}
                <p className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', margin: '6px 0 0', letterSpacing: '0.12em' }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Empty / idle state */}
        {!submitted && (
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 32, marginTop: 8 }}>
            <p className="hl-serif" style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--bone-faint)', lineHeight: 1.7, maxWidth: '44ch', margin: 0 }}>
              Search across every memory, voice recording, and letter in your thread — exact words or phrases.
            </p>
          </div>
        )}

      </div>
    </AppFrame>
  );
}

// Wrap matching text in a <mark> span
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'transparent', color: 'var(--warm)', fontStyle: 'normal' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
