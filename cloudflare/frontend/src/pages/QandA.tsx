import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';

/**
 * QandA — Loom 3 "ask the thread" (RAG, cited).
 *
 * Ask a question of the family thread; the Listener answers from the
 * entries you are allowed to read, and cites every claim back to a
 * specific entry. Rendered as quiet Source Serif 4 prose with citations
 * as mono links beneath — never a chatbot bubble (§1.5C, the Listener
 * is one typographic surface).
 *
 * ── Honesty caveat ──────────────────────────────────────────────────
 * There is NO RAG / "ask the archive" endpoint yet (searchApi.search is
 * the closest real call — FTS over your own memories/voice/letters).
 * Rather than fabricate synthesised answers, this page wires the real
 * FTS call and surfaces genuine matching entries as cited sources.
 * When a real RAG endpoint lands, only `runQuery` and the answer block
 * need to change. All types, state, and API calls are preserved.
 */

interface SourceEntry {
  id: string;
  type: string; // 'memory' | 'voice' | 'letter'
  subType?: string;
  title: string | null;
  snippet: string | null;
  createdAt: string | null;
  /** A real dye/category value off the entry, if the search result carries one. Never invented. */
  dye?: string | null;
}

/**
 * Natural-dye palette (§2.7) — the only place a dye color may appear.
 * Mapped ONLY from a real `dye` value on a result; never fabricated.
 */
const DYE_VARS: Record<string, string> = {
  madder: 'var(--dye-madder)',
  cochineal: 'var(--dye-cochineal)',
  kermes: 'var(--dye-kermes)',
  saffron: 'var(--dye-saffron)',
  weld: 'var(--dye-weld)',
  walnut: 'var(--dye-walnut)',
  oakgall: 'var(--dye-oakgall)',
  woad: 'var(--dye-woad)',
  indigo: 'var(--dye-indigo)',
  iron: 'var(--dye-iron)',
};

type AskState =
  | { phase: 'idle' }
  | { phase: 'asking' }
  | { phase: 'answered'; question: string; sources: SourceEntry[] }
  | { phase: 'error'; question: string };

const SUGGESTIONS = [
  'When did Dad first meet Mom?',
  'How did Grandma describe the farm?',
  'Every entry that mentions the kitchen.',
  'What did Maya inherit from each grandparent?',
  'The years with the most about grief.',
];

export function QandA() {
  const [question, setQuestion] = useState('');
  const [state, setState] = useState<AskState>({ phase: 'idle' });

  async function runQuery(q: string) {
    const query = q.trim();
    if (query.length < 2) return;
    setQuestion(query);
    setState({ phase: 'asking' });
    try {
      // Closest real call: full-text retrieval over the entries you may read.
      const res = await searchApi.search(query, 'all', 12);
      const sources: SourceEntry[] = (res.data?.results ?? []).map((r: any) => ({
        id: String(r.id),
        type: String(r.type ?? 'entry'),
        subType: r.subType ? String(r.subType) : undefined,
        title: r.title ?? null,
        snippet: r.snippet ?? null,
        createdAt: r.createdAt ?? null,
        dye: r.dye ?? r.category ?? null,
      }));
      setState({ phase: 'answered', question: query, sources });
    } catch {
      setState({ phase: 'error', question: query });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runQuery(question);
  }

  return (
    <ClothShell
      topbarLeft={<Link to="/loom" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textDecoration: 'none', textTransform: 'uppercase' }}>← heirloom</Link>}
      topbarCenter="ask the thread"
    >
      <style>{`
        @media (max-width: 767px) {
          .qanda-grid { grid-template-columns: 1fr !important; }
          .qanda-aside { display: none !important; }
        }
      `}</style>
      <div
        style={{
          paddingTop: 80,
          paddingBottom: 36,
          paddingLeft: 'clamp(20px, 5vw, 56px)',
          paddingRight: 'clamp(20px, 5vw, 56px)',
        }}
      >
        <div
          className="qanda-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: 56,
            alignItems: 'start',
          }}
        >
          {/* ── left: question + answer column ── */}
          <div style={{ minWidth: 0 }}>
            {/* Current question heading */}
            <h2
              className="hl-serif"
              style={{
                fontSize: 30,
                fontWeight: 400,
                letterSpacing: '-0.014em',
                margin: '0 0 0',
                color: 'var(--bone)',
                fontStyle: state.phase === 'idle' ? 'italic' : undefined,
              }}
            >
              {state.phase === 'idle'
                ? 'ask the thread.'
                : state.phase === 'asking'
                ? 'thinking…'
                : state.phase === 'answered' || state.phase === 'error'
                ? (state as { question: string }).question
                : 'ask the thread.'}
            </h2>

            {/* Answer prose */}
            {state.phase === 'idle' && (
              <p
                className="hl-prose"
                style={{
                  fontSize: 18,
                  marginTop: 16,
                  marginBottom: 24,
                  color: 'var(--bone-faint)',
                  fontStyle: 'italic',
                  maxWidth: '62ch',
                }}
              >
                Ask anything of the thread. The Listener will find the entries that answer it
                and cite each one.
              </p>
            )}

            {state.phase === 'asking' && (
              <div style={{ marginTop: 16, marginBottom: 24 }}>
                <p
                  className="hl-mono"
                  style={{
                    fontSize: 12,
                    fontStyle: 'italic',
                    color: 'var(--bone-dim)',
                    marginBottom: 12,
                  }}
                >
                  thinking…
                </p>
                <Shuttle />
              </div>
            )}

            {state.phase === 'error' && (
              <p
                className="hl-prose"
                style={{
                  fontSize: 18,
                  marginTop: 16,
                  marginBottom: 24,
                  color: 'var(--bone-dim)',
                  fontStyle: 'italic',
                }}
              >
                The thread could not be reached. Try the question again.
              </p>
            )}

            {state.phase === 'answered' && (
              <>
                <p
                  className="hl-prose"
                  style={{
                    fontSize: 18,
                    marginTop: 16,
                    marginBottom: 24,
                    color: 'var(--bone)',
                    maxWidth: '62ch',
                    lineHeight: 1.8,
                  }}
                >
                  {state.sources.length > 0 ? (
                    <>
                      The thread holds{' '}
                      <span style={{ color: 'var(--warm)' }}>
                        {state.sources.length}{' '}
                        {state.sources.length === 1 ? 'entry' : 'entries'}
                      </span>{' '}
                      that touch <em>"{state.question}"</em>. They are cited below, each
                      opening to the entry it came from. The Listener does not yet compose a
                      woven answer — it shows only the true entries your question touches,
                      never words it has invented.
                    </>
                  ) : (
                    <>
                      Nothing in the entries you can read speaks to{' '}
                      <em>"{state.question}"</em> yet.
                    </>
                  )}
                </p>

                {/* Citations row */}
                {state.sources.length > 0 && (
                  <div
                    className="hl-mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--bone-faint)',
                      letterSpacing: '0.04em',
                      marginBottom: 24,
                      display: 'flex',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    {state.sources.map((s, i) => (
                      <Link
                        key={s.id}
                        to={sourceHref(s)}
                        style={{
                          color: 'var(--bone-faint)',
                          textDecoration: 'none',
                          borderBottom: '1px solid var(--rule)',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = 'var(--bone)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = 'var(--bone-faint)')
                        }
                      >
                        [{i + 1}]
                      </Link>
                    ))}
                  </div>
                )}

                {/* Cited entries list */}
                {state.sources.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {state.sources.map((s, i) => (
                      <Citation key={s.id} index={i + 1} source={s} />
                    ))}
                  </ul>
                )}
              </>
            )}

            <hr
              className="hl-rule"
              style={{ marginTop: 32, marginBottom: 0, border: 0, borderTop: '1px solid var(--rule)' }}
            />

            {/* New question row */}
            <form
              onSubmit={onSubmit}
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="ask something…"
                className="hl-serif"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 0,
                  outline: 'none',
                  color: 'var(--bone)',
                  fontSize: 17,
                  fontWeight: 400,
                  fontStyle: 'italic',
                  padding: '14px 0',
                  letterSpacing: '-0.006em',
                }}
              />
              <button
                type="submit"
                className="hl-link warm"
                disabled={state.phase === 'asking' || question.trim().length < 2}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: question.trim().length < 2 ? 'default' : 'pointer',
                  opacity: question.trim().length < 2 ? 0.4 : 1,
                  padding: '14px 0 14px 16px',
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--serif)',
                  color: 'var(--warm)',
                  letterSpacing: '-0.006em',
                }}
              >
                ask →
              </button>
            </form>
          </div>

          {/* ── right 320px: suggested prompts ── */}
          <aside className="qanda-aside" style={{ minWidth: 0 }}>
            <p
              className="hl-eyebrow"
              style={{ marginBottom: 14 }}
            >
              suggested
            </p>
            <div>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void runQuery(s)}
                  className="hl-serif"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid var(--rule)',
                    padding: '12px 0',
                    color: 'var(--bone-dim)',
                    fontSize: 14,
                    lineHeight: 1.55,
                    cursor: 'pointer',
                    transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                    fontWeight: 400,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bone)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
                >
                  {s}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </ClothShell>
  );
}

/* ── a single cited source entry ── */
function Citation({ index, source }: { index: number; source: SourceEntry }) {
  const to = sourceHref(source);
  const snippet = stripMarks(source.snippet);
  const dyeColor = source.dye ? DYE_VARS[source.dye.toLowerCase()] : undefined;
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '30px 14px 96px 1fr 88px',
        gap: 14,
        padding: '12px 0',
        borderTop: '1px solid var(--rule)',
        alignItems: 'baseline',
      }}
    >
      <span className="hl-mono" style={{ color: 'var(--warm)', fontSize: 10 }}>
        [{index}]
      </span>
      {/* dye swatch — colored only when a real dye is present, else honest blank */}
      <span
        aria-hidden
        style={{ width: 14, height: 2, alignSelf: 'center', background: dyeColor ?? 'transparent' }}
      />
      <span
        className="hl-mono"
        style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--bone-faint)' }}
      >
        {source.createdAt ? formatDate(source.createdAt) : '—'}
      </span>
      <Link
        to={to}
        className="hl-serif"
        style={{ fontSize: 14, color: 'var(--bone)', fontWeight: 400, textDecoration: 'none' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone)')}
      >
        {source.title ?? 'Untitled entry'}
        {snippet ? (
          <span
            className="hl-serif"
            style={{
              display: 'block',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--bone-dim)',
              marginTop: 2,
            }}
          >
            {snippet}
          </span>
        ) : null}
      </Link>
      <span
        className="hl-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          color: 'var(--bone-faint)',
          textAlign: 'right',
          textTransform: 'lowercase',
        }}
      >
        {source.subType ?? source.type}
      </span>
    </li>
  );
}

/**
 * Loading affordance: 1px warm hairline shuttle.
 * Local keyframe scoped to the bar's own box so the sweep is visible
 * within the column. No spinner.
 */
function Shuttle() {
  return (
    <div
      style={{
        height: 1,
        background: 'var(--rule)',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-label="Asking the thread"
    >
      <style>{`
        @keyframes qanda-shuttle {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 1,
          width: '40%',
          background: 'color-mix(in srgb, var(--warm) 40%, transparent)',
          animation: 'qanda-shuttle 1.4s cubic-bezier(0.16,1,0.3,1) infinite',
        }}
      />
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function sourceHref(source: SourceEntry): string {
  switch (source.type) {
    case 'memory':
      return `/memory/${source.id}`;
    case 'voice':
      return `/record?recording=${source.id}`;
    case 'letter':
      return `/letters/${source.id}`;
    default:
      return `/memory/${source.id}`;
  }
}

/** Search snippets arrive with <mark> tags — render them as plain text. */
function stripMarks(s: string | null): string {
  if (!s) return '';
  return s.replace(/<\/?mark>/g, '').trim();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
