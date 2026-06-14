import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';

/**
 * SearchPage — Loom native "Find a thread."
 *
 * Reads the family thread via searchApi.search. The endpoint rejects queries
 * shorter than two characters, so the query stays idle until then.
 */

interface SearchResult {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  snippet: string;
  created_at: string;
  score: number;
}

interface SearchBody {
  results: SearchResult[];
  total: number;
}

type TypeFilter = undefined | 'memories' | 'voice' | 'letters';

const FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'all',      value: undefined },
  { label: 'memories', value: 'memories' },
  { label: 'voice',    value: 'voice' },
  { label: 'letters',  value: 'letters' },
];

const ROW_LINK: Record<SearchResult['type'], string> = {
  memory: '/memories',
  voice:  '/record',
  letter: '/letters',
};

export function SearchPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(undefined);

  // debounce the raw input into the query that actually fires the request
  useEffect(() => {
    const t = setTimeout(() => setQuery(input), 300);
    return () => clearTimeout(t);
  }, [input]);

  const trimmed = query.trim();
  const ready = trimmed.length >= 2;

  const searchQ = useQuery({
    queryKey: ['search', trimmed, typeFilter ?? 'all'],
    enabled: ready,
    placeholderData: keepPreviousData,
    queryFn: () =>
      searchApi.search(trimmed, typeFilter ?? 'all').then((r) => r.data as SearchBody),
  });

  const results = searchQ.data?.results ?? [];
  const total = searchQ.data?.total ?? 0;

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'today', to: '/loom/today' }, { label: 'search' }]} />}
    >
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x)',
          paddingBottom: 'var(--page-clear)',
          overflowX: 'hidden',
        }}
      >
        {/* ── search input ── */}
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="search your family's thread…"
          aria-label="search"
          style={{
            width: '100%',
            background: 'transparent',
            border: 0,
            borderBottom: '1px solid var(--rule)',
            color: 'var(--bone)',
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(22px, 5vw, 32px)',
            fontWeight: 300,
            padding: '0 0 14px',
            margin: '0 0 24px',
            outline: 'none',
          }}
        />

        {/* ── type filter row ── */}
        <div style={{ display: 'flex', gap: 22, marginBottom: 40 }}>
          {FILTERS.map((f) => {
            const active = typeFilter === f.value;
            return (
              <button
                key={f.label}
                className="hl-btn text"
                onClick={() => setTypeFilter(f.value)}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--warm)' : 'var(--bone-dim)',
                  padding: 0,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ── states ── */}
        {!ready ? (
          <p
            className="hl-mono"
            style={{
              textAlign: 'center',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              marginTop: 64,
            }}
          >
            type at least two letters
          </p>
        ) : searchQ.isLoading ? (
          <div style={{ marginTop: 40 }}>
            <ProgressHair width={80} />
          </div>
        ) : searchQ.isError ? (
          <p
            className="hl-mono"
            style={{
              fontSize: 12,
              letterSpacing: '0.12em',
              color: 'var(--warm)',
              marginTop: 24,
            }}
          >
            search faltered. try again.
          </p>
        ) : results.length === 0 ? (
          <p
            className="hl-serif"
            style={{
              fontStyle: 'italic',
              color: 'var(--bone-faint)',
              marginTop: 48,
            }}
          >
            nothing in the thread matches that — yet.
          </p>
        ) : (
          <>
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
                marginBottom: 14,
              }}
            >
              {total} {total === 1 ? 'thread' : 'threads'}
            </p>
            {results.map((r) => (
              <Link
                key={r.id}
                to={ROW_LINK[r.type]}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{ borderBottom: '1px solid var(--rule)', padding: '14px 0' }}>
                  <div
                    className="hl-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-faint)',
                      marginBottom: 6,
                    }}
                  >
                    {r.type} · {formatDate(r.created_at)}
                  </div>
                  <div
                    className="hl-serif"
                    style={{ fontSize: 16, color: 'var(--bone)', fontWeight: 400 }}
                  >
                    {r.title}
                  </div>
                  {r.snippet ? (
                    <div
                      className="hl-serif"
                      style={{
                        fontSize: 14,
                        fontStyle: 'italic',
                        color: 'var(--bone-dim)',
                        marginTop: 4,
                      }}
                    >
                      {r.snippet}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </ClothShell>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
