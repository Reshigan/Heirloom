import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { ProgressHair } from '../loom/components/ProgressHair';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

/**
 * QandA — Loom 3 "ask the thread" (RAG, cited), Cosmic COMPOSER archetype.
 *
 * The Listener asks; you answer. The active question leads as a giant serif
 * prompt under the mono eyebrow "THE LISTENER ASKS". The answer is set down
 * the serif body surface; a bottom action bar carries the warm ASK pill, a
 * mono date pill, and a SHUFFLE affordance that rotates the next question.
 * Cited sources from the family thread are set down as quiet mono rows that
 * open to the entry they were woven from. The Listener speaks only from what
 * was truly written — never words it has invented (§1.5C, one typographic
 * surface, never a chatbot bubble).
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

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

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

  /** SHUFFLE — drop a fresh prompt from the Listener into the field. */
  function shuffle() {
    const next = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
    setQuestion(next);
  }

  // The active question leads as the giant serif prompt; idle invites one.
  const leadQuestion =
    state.phase === 'idle' ? null : (state as { question: string }).question;

  const today = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const canAsk = question.trim().length >= 2 && state.phase !== 'asking';

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
        <div style={{ maxWidth: 620, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* ── mono eyebrow ── */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              marginTop: 8,
              marginBottom: 18,
            }}
          >
            the listener asks
          </div>

          {/* ── the question, as a giant serif prompt ── */}
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(30px, 6vw, 46px)',
              fontWeight: 380,
              lineHeight: 1.06,
              letterSpacing: '-0.012em',
              color: 'var(--bone)',
              margin: '0 0 36px',
              fontVariationSettings: '"opsz" 40',
            }}
          >
            {leadQuestion ?? 'What do you want to know?'}
          </h1>

          {/* ── the Listener's answer / states ── */}
          <div style={{ flex: 1 }}>
            {/* idle: quiet suggested questions — the Listener offers prompts */}
            {state.phase === 'idle' && (
              <div>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    margin: '0 0 6px',
                  }}
                >
                  or ask
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {SUGGESTIONS.map((s) => (
                    <li key={s} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <button
                        type="button"
                        onClick={() => void runQuery(s)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 0,
                          padding: '14px 0',
                          color: 'var(--bone-dim)',
                          fontFamily: 'var(--serif)',
                          fontStyle: 'italic',
                          fontSize: 18,
                          lineHeight: 1.5,
                          cursor: 'pointer',
                          transition: `color 180ms ${EASE}`,
                          fontWeight: 400,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bone)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* asking: ProgressHair thinking state */}
            {state.phase === 'asking' && (
              <div style={{ marginTop: 8 }}>
                <ProgressHair label="listening…" />
              </div>
            )}

            {/* error — inline mono line, warm (never red, never toast) */}
            {state.phase === 'error' && (
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  letterSpacing: '0.04em',
                  color: 'var(--warm)',
                  lineHeight: 1.7,
                  margin: 0,
                  paddingLeft: 18,
                  borderLeft: '1px solid var(--warm)',
                }}
              >
                The thread could not be reached. Ask the question again.
              </p>
            )}

            {/* answered: flowing serif body with a thin warm left-rule */}
            {state.phase === 'answered' && (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 18,
                    margin: 0,
                    color: 'var(--bone)',
                    lineHeight: 1.75,
                    paddingLeft: 24,
                    borderLeft: '3px solid var(--warm)',
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
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    margin: '36px 0 0',
                  }}
                >
                  woven from {state.sources.length}{' '}
                  {state.sources.length === 1 ? 'memory' : 'memories'}
                </div>
              </div>
            )}
          </div>

          {/* ── compose the answer: serif body surface + bottom action bar ── */}
          <form onSubmit={onSubmit} style={{ marginTop: 40 }}>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--warm-dim)',
                margin: '0 0 12px',
              }}
            >
              your answer
            </div>

            {/* serif body answer surface — 18px / 1.75, warm caret, no box */}
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Answer in your own words…"
              aria-label="Ask the thread"
              rows={3}
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--warm)',
                outline: 'none',
                resize: 'none',
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                fontFamily: 'var(--serif)',
                fontSize: 18,
                fontWeight: 400,
                lineHeight: 1.75,
                padding: '4px 0 14px',
                letterSpacing: '-0.006em',
              }}
            />

            {/* bottom action bar: ASK warm pill · date pill · shuffle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                marginTop: 18,
              }}
            >
              <button
                type="submit"
                disabled={!canAsk}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: canAsk ? 'var(--ink)' : 'var(--warm)',
                  background: canAsk ? 'var(--warm)' : 'transparent',
                  border: '1px solid var(--warm)',
                  borderRadius: 999,
                  padding: '11px 22px',
                  cursor: canAsk ? 'pointer' : 'default',
                  opacity: canAsk ? 1 : 0.5,
                  whiteSpace: 'nowrap',
                  transition: `opacity 180ms ${EASE}, background 180ms ${EASE}, color 180ms ${EASE}`,
                }}
              >
                ask →
              </button>

              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  border: '1px solid var(--rule)',
                  borderRadius: 999,
                  padding: '8px 16px',
                  whiteSpace: 'nowrap',
                }}
              >
                {today}
              </span>

              <button
                type="button"
                onClick={shuffle}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-dim)',
                  padding: '8px 0',
                  whiteSpace: 'nowrap',
                  transition: `color 180ms ${EASE}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
              >
                shuffle ∞
              </button>
            </div>
          </form>

          <div style={{ marginTop: 40 }}>
            <WaxSeal size={26} />
          </div>
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
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          fontFamily: 'var(--mono)',
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
