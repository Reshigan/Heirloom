import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';
import { EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

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

// Server-side filter values must match the worker's singular type names
// ('memory'|'voice'|'letter'|'all') — labels stay plural for display only.
type TypeFilter = undefined | 'memory' | 'voice' | 'letter';

const FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'all',      value: undefined },
  { label: 'memories', value: 'memory' },
  { label: 'voice',    value: 'voice' },
  { label: 'letters',  value: 'letter' },
];

// Route a search hit to the specific entry it represents (id carried through),
// not a generic list. Mirrors FamilyFeed's itemTo so search and feed agree.
function entryLink(r: SearchResult): string {
  if (r.type === 'voice') return `/loom/voice?id=${r.id}`;
  if (r.type === 'letter') return `/loom/letter?id=${r.id}`;
  return `/loom/read?entry=${r.id}`;
}

const KIND_LABEL: Record<SearchResult['type'], string> = {
  memory: 'memory',
  voice:  'voice',
  letter: 'letter',
};

/** Section grouping — ordered, with the mono group label per kind. */
const GROUPS: { type: SearchResult['type']; label: string }[] = [
  { type: 'memory', label: 'Memories' },
  { type: 'letter', label: 'Letters' },
  { type: 'voice',  label: 'Voices' },
];

export function SearchPage() {
  const navigate = useNavigate();
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

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'today', to: '/loom/today' }, { label: 'search' }]} />}
    >
      <style>{`
        .hl-search-flat::placeholder {
          color: var(--bone-faint);
          text-transform: uppercase;
          letter-spacing: 0.22em;
        }
        .hl-search-flat:focus {
          border-bottom-color: var(--warm);
          outline: none;
        }
        .hl-filter-btn {
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          transition: color 180ms var(--ease);
        }
      `}</style>

      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x)',
          paddingBottom: 'var(--page-clear)',
          maxWidth: 'var(--page-max-prose)',
          margin: '0 auto',
          overflowX: 'hidden',
        }}
      >
        {/* ── LEDGER header: two-tone giant serif title ── */}
        <header style={{ marginBottom: 40 }}>
          <h1
            className="hl-serif"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(34px, 7vw, 58px)',
              lineHeight: 1.04,
              letterSpacing: '-0.012em',
              color: 'var(--bone)',
              margin: 0,
              fontWeight: 380,
            }}
          >
            Search<br />
            <span style={{ color: 'var(--bone-dim)' }}>the family archive.</span>
          </h1>
        </header>

        {/* ── eyebrow + hairline above the input ── */}
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--copper-label)',
            marginBottom: 14,
          }}
        >
          Search the thread
        </div>
        <div
          aria-hidden="true"
          style={{ height: 1, background: 'var(--hairline-3)', marginBottom: 24 }}
        />

        {/* ── flat serif search input: transparent, warm caret, underline only ── */}
        <input
          autoFocus
          className="hl-search-flat"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search the thread"
          aria-label="search"
          style={{
            display: 'block',
            width: '100%',
            background: 'transparent',
            border: 0,
            borderBottom: '1px solid var(--rule)',
            color: 'var(--bone)',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            caretColor: 'var(--warm)',
            padding: '0 0 16px',
            margin: '0 0 28px',
            transition: 'border-bottom-color 180ms var(--ease)',
          }}
        />

        {/* ── type filter bar: quiet mono text affordances ── */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
          {FILTERS.map((f) => {
            const active = typeFilter === f.value;
            return (
              <button
                key={f.label}
                className="hl-filter-btn"
                onClick={() => setTypeFilter(f.value)}
                style={{ position: 'relative', color: active ? 'var(--warm)' : '#c9b89c' }}
              >
                {f.label}
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -7,
                      height: 2,
                      background: 'var(--warm)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── states ── */}
        {!ready ? (
          <p
            style={{
              textAlign: 'center',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 17,
              color: 'var(--bone-faint)',
              marginTop: 72,
              lineHeight: 1.6,
            }}
          >
            type at least two letters to search the archive.
          </p>
        ) : searchQ.isLoading ? (
          <div style={{ marginTop: 40 }}>
            <ProgressHair width={80} />
          </div>
        ) : searchQ.isError ? (
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              marginTop: 24,
            }}
          >
            search faltered. try again.
          </p>
        ) : results.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 17,
              color: 'var(--bone-faint)',
              marginTop: 72,
              lineHeight: 1.6,
            }}
          >
            nothing in the thread matches that — yet.
          </p>
        ) : (
          <>
            {GROUPS.map(({ type, label }) => {
              const hits = results.filter((r) => r.type === type);
              if (hits.length === 0) return null;
              return (
                <section key={type}>
                  <SectionLabel>{label}</SectionLabel>
                  {hits.map((r) => (
                    <EntryRow
                      key={r.id}
                      title={r.title}
                      titleFont="serif"
                      titleSize={21}
                      titleColor="var(--text-soft)"
                      sub={
                        r.snippet ? (
                          <span
                            style={{
                              fontFamily: 'var(--serif)',
                              fontStyle: 'italic',
                              fontSize: 14,
                              color: 'var(--muted-2)',
                              lineHeight: 1.5,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {r.snippet}
                          </span>
                        ) : undefined
                      }
                      year={formatYear(r.created_at)}
                      meta={KIND_LABEL[r.type].toUpperCase()}
                      onClick={() => navigate(entryLink(r))}
                    />
                  ))}
                </section>
              );
            })}
          </>
        )}

        {/* ── WaxSeal foot ── */}
        <div style={{ marginTop: 96, marginBottom: 24 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </ClothShell>
  );
}

function formatYear(iso: string): string {
  try {
    return String(new Date(iso).getFullYear());
  } catch {
    return iso;
  }
}
