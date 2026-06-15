import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { ProgressHair } from '../loom/components/ProgressHair';

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
          minHeight: 'calc(100dvh - var(--topbar-h, 56px))',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'var(--page-pad-top)',
          paddingBottom: 28,
          paddingLeft: 'var(--page-pad-x)',
          paddingRight: 'var(--page-pad-x)',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* ── tiny mono eyebrow ── */}
          <p
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--warm-dim)',
              textAlign: 'center',
              margin: '12px 0 22px',
            }}
          >
            ask the thread
          </p>

          {/* ── the question, as a light serif prompt ── */}
          <h1
            className="hl-serif"
            style={{
              fontSize: 'clamp(28px, 7vw, 38px)',
              fontWeight: 400,
              lineHeight: 1.12,
              letterSpacing: '-0.01em',
              color: 'var(--bone)',
              textAlign: 'center',
              margin: '0 0 36px',
            }}
          >
            {state.phase === 'idle'
              ? 'What do you want to know?'
              : (state as { question: string }).question}
          </h1>

          {/* ── the oracle answer / states ── */}
          <div style={{ flex: 1 }}>
            {/* idle: quiet suggested questions */}
            {state.phase === 'idle' && (
              <div style={{ maxWidth: 420, margin: '0 auto' }}>
                <p
                  className="hl-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    textAlign: 'center',
                    margin: '0 0 12px',
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
                      textAlign: 'center',
                      background: 'transparent',
                      border: 0,
                      padding: '11px 0',
                      color: 'var(--bone-dim)',
                      fontStyle: 'italic',
                      fontSize: 16,
                      lineHeight: 1.5,
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

            {/* asking: ProgressHair thinking state */}
            {state.phase === 'asking' && (
              <div style={{ marginTop: 8 }}>
                <ProgressHair label="listening…" />
              </div>
            )}

            {/* error */}
            {state.phase === 'error' && (
              <p
                className="hl-prose"
                style={{
                  fontSize: 18,
                  color: 'var(--bone-dim)',
                  fontStyle: 'italic',
                  lineHeight: 1.85,
                  paddingLeft: 18,
                  borderLeft: '1px solid var(--warm)',
                }}
              >
                The thread could not be reached. Ask the question again.
              </p>
            )}

            {/* answered: flowing serif prose with a thin warm left-rule */}
            {state.phase === 'answered' && (
              <div>
                <p
                  className="hl-prose"
                  style={{
                    fontSize: 19,
                    margin: 0,
                    color: 'var(--bone)',
                    lineHeight: 1.85,
                    paddingLeft: 18,
                    borderLeft: '1px solid var(--warm)',
                  }}
                >
                  {state.sources.length > 0 ? (
                    <>
                      The thread holds{' '}
                      <span style={{ color: 'var(--warm)' }}>
                        {state.sources.length}{' '}
                        {state.sources.length === 1 ? 'memory' : 'memories'}
                      </span>{' '}
                      that touch <em>"{state.question}"</em>. Each is set down below,
                      and opens to the entry it was woven from. The Listener speaks only
                      from what was truly written, never words it has invented.
                    </>
                  ) : (
                    <>
                      Nothing in the entries you can read yet speaks to{' '}
                      <em>"{state.question}"</em>.
                    </>
                  )}
                </p>

                {/* cited sources — quiet mono rows */}
                {state.sources.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0' }}>
                    {state.sources.map((s, i) => (
                      <Citation key={s.id} index={i + 1} source={s} />
                    ))}
                  </ul>
                )}

                {/* archival footer label */}
                <p
                  className="hl-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    margin: '36px 0 0',
                  }}
                >
                  woven from {state.sources.length}{' '}
                  {state.sources.length === 1 ? 'memory' : 'memories'}
                </p>
              </div>
            )}
          </div>

          {/* ── single underlined input, pinned low, amber caret ── */}
          <form onSubmit={onSubmit} style={{ marginTop: 40 }}>
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--warm-dim)',
                margin: '0 0 10px',
              }}
            >
              ask anything
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                borderBottom: '1px solid var(--warm)',
              }}
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="…"
                className="hl-serif"
                aria-label="Ask the thread"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 0,
                  outline: 'none',
                  color: 'var(--bone)',
                  caretColor: 'var(--warm)',
                  fontSize: 18,
                  fontWeight: 400,
                  padding: '12px 0',
                  letterSpacing: '-0.006em',
                }}
              />
              <button
                type="submit"
                disabled={state.phase === 'asking' || question.trim().length < 2}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: question.trim().length < 2 ? 'default' : 'pointer',
                  opacity: question.trim().length < 2 ? 0.35 : 1,
                  padding: '12px 0 12px 16px',
                  fontSize: 18,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--serif)',
                  color: 'var(--warm)',
                  transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                →
              </button>
            </div>
          </form>
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
    <li style={{ padding: '10px 0', borderTop: '1px solid var(--rule)' }}>
      <Link
        to={to}
        className="hl-mono"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          fontSize: 10,
          letterSpacing: '0.06em',
          color: 'var(--bone-faint)',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bone)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
      >
        <span style={{ color: 'var(--warm)', flex: '0 0 auto' }}>[{index}]</span>
        {/* dye swatch — colored only when a real dye is present, else honest blank */}
        <span
          aria-hidden
          style={{ width: 12, height: 2, alignSelf: 'center', flex: '0 0 auto', background: dyeColor ?? 'transparent' }}
        />
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          — from <span style={{ fontStyle: 'italic' }}>{source.title ?? snippet ?? 'an untitled entry'}</span>
          {source.createdAt ? `, ${formatYear(source.createdAt)}` : ''}
        </span>
        <span style={{ flex: '0 0 auto', textTransform: 'lowercase' }}>
          {source.subType ?? source.type}
        </span>
      </Link>
    </li>
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

function formatYear(iso: string): string {
  try {
    return String(new Date(iso).getFullYear());
  } catch {
    return iso;
  }
}
