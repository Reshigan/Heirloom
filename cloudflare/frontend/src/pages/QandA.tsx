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
      <div
        style={{
          paddingTop: 'var(--page-pad-top)',
          paddingBottom: 80,
          paddingLeft: 'var(--page-pad-x)',
          paddingRight: 'var(--page-pad-x)',
        }}
      >
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          {/* ── mono eyebrow ── */}
          <p
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              margin: '0 0 28px',
            }}
          >
            ask the bloodline
          </p>

          {/* ── serif prompt — the hero ── */}
          <h1
            className="hl-serif"
            style={{
              fontSize: 'clamp(34px, 6vw, 52px)',
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: 'var(--bone)',
              margin: '0 0 36px',
            }}
          >
            What do you<br />want to know
          </h1>

          {/* ── underlined input ── */}
          <form onSubmit={onSubmit} style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                borderBottom: '1px solid var(--rule-strong)',
              }}
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="ask something…"
                className="hl-serif"
                aria-label="Ask the thread"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 0,
                  outline: 'none',
                  color: 'var(--bone)',
                  fontSize: 19,
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
                  transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                ask →
              </button>
            </div>
          </form>

          {/* ── idle: suggested questions as quiet serif links ── */}
          {state.phase === 'idle' && (
            <div style={{ marginTop: 44 }}>
              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  margin: '0 0 10px',
                }}
              >
                or ask
              </p>
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
                    padding: '13px 0',
                    color: 'var(--bone-dim)',
                    fontSize: 15,
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
          )}

          {/* ── asking ── */}
          {state.phase === 'asking' && (
            <div style={{ marginTop: 40 }}>
              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  marginBottom: 14,
                }}
              >
                listening…
              </p>
              <Shuttle />
            </div>
          )}

          {/* ── error ── */}
          {state.phase === 'error' && (
            <p
              className="hl-prose"
              style={{
                fontSize: 18,
                marginTop: 40,
                color: 'var(--bone-dim)',
                fontStyle: 'italic',
                lineHeight: 1.8,
              }}
            >
              The thread could not be reached. Try the question again.
            </p>
          )}

          {/* ── answered: serif prose + cited sources ── */}
          {state.phase === 'answered' && (
            <div style={{ marginTop: 40 }}>
              <p
                className="hl-prose"
                style={{
                  fontSize: 18,
                  margin: 0,
                  color: 'var(--bone)',
                  maxWidth: '58ch',
                  lineHeight: 1.85,
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
                    opening to the entry it came from. The Listener shows only the true
                    entries your question touches, never words it has invented.
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
                    marginTop: 28,
                    marginBottom: 8,
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
                <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
                  {state.sources.map((s, i) => (
                    <Citation key={s.id} index={i + 1} source={s} />
                  ))}
                </ul>
              )}

              {/* ── archival footer label ── */}
              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  margin: '40px 0 0',
                }}
              >
                woven from {state.sources.length}{' '}
                {state.sources.length === 1 ? 'memory' : 'memories'}
              </p>
            </div>
          )}
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
      return `/loom/read?entry=${source.id}`;
    case 'voice':
      return `/loom/voice?id=${source.id}`;
    case 'letter':
      return `/loom/letter`;
    default:
      return `/loom/read?entry=${source.id}`;
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
