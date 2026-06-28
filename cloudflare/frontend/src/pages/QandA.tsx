import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../services/api';
import { DYES, dyeVar, type Dye } from '../loom/dye';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
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

import { EASE } from '../loom/motion';

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

  const canAsk = question.trim().length >= 2 && state.phase !== 'asking';

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom' }, { label: 'q&a' }]} />}
    >
      <div
        style={{
          minHeight: 'calc(100dvh - var(--topbar-h, 68px))',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'var(--page-pad-top)',
          paddingBottom: 28,
          paddingLeft: 'var(--page-pad-x)',
          paddingRight: 'var(--page-pad-x)',
        }}
      >
        <div style={{ maxWidth: 620, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* ── warm mono eyebrow ── */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
              marginTop: 8,
              marginBottom: 22,
            }}
          >
            ask the thread
          </div>

          {/* ── the asked question, as a giant serif prompt ── */}
          <h1
            className="hl-serif"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(30px, 6vw, 46px)',
              fontWeight: 380,
              lineHeight: 1.08,
              letterSpacing: '-0.012em',
              color: 'var(--bone)',
              margin: '0 0 32px',
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
                    letterSpacing: '0.2em',
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

            {/* answered: flowing serif prose answer — one quiet typographic surface */}
            {state.phase === 'answered' && (
              <div>
                {/* signature LEFT vertical gradient rule beside the answer */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <div
                    aria-hidden
                    style={{
                      width: 1,
                      flex: '0 0 auto',
                      alignSelf: 'stretch',
                      background: 'var(--rule)',
                    }}
                  />
                  <p
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 'clamp(18px, 2.8vw, 21px)',
                      margin: 0,
                      color: 'var(--text-warm)',
                      lineHeight: 1.75,
                      fontWeight: 400,
                    }}
                  >
                    {state.sources.length > 0 ? (
                      <>
                        The thread holds{' '}
                        <span style={{ color: 'var(--warm)' }}>
                          {state.sources.length}{' '}
                          {state.sources.length === 1 ? 'memory' : 'memories'}
                        </span>{' '}
                        that touch <em>"{state.question}"</em> — each set down below,
                        opening to the entry it was woven from. The thread speaks only
                        from what was truly written, never words it has invented.
                      </>
                    ) : (
                      <>
                        Nothing in the entries you can read yet speaks to{' '}
                        <em>"{state.question}"</em>.
                      </>
                    )}
                  </p>
                </div>

                {/* cited sources — quiet mono dim "— from <source>, <year>" lines */}
                {state.sources.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '40px 0 0' }}>
                    {state.sources.map((s) => (
                      <Citation key={s.id} source={s} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* ── ASK ANYTHING — copper mono label + top hairline + underlined hl-input ── */}
          <form
            onSubmit={onSubmit}
            style={{ marginTop: 40, borderTop: '1px solid var(--hairline-2)', paddingTop: 24 }}
          >
            <label
              htmlFor="qa-ask"
              style={{
                display: 'block',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--copper-label)',
                margin: '0 0 10px',
              }}
            >
              ask anything
            </label>

            <input
              id="qa-ask"
              type="search"
              className="hl-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do you want to know?"
              aria-label="Ask the thread"
              autoComplete="off"
              style={{
                caretColor: 'var(--warm)',
                fontSize: 18,
                fontWeight: 400,
              }}
            />

            {/* submit is the Enter key on the field; a quiet inline ask/shuffle pair */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                marginTop: 16,
              }}
            >
              <button
                type="submit"
                disabled={!canAsk}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  background: 'transparent',
                  border: 0,
                  padding: '6px 0',
                  cursor: canAsk ? 'pointer' : 'default',
                  opacity: canAsk ? 1 : 0.4,
                  whiteSpace: 'nowrap',
                  transition: `opacity 180ms ${EASE}, color 180ms ${EASE}`,
                }}
              >
                ask →
              </button>

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
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  padding: '6px 0',
                  whiteSpace: 'nowrap',
                  transition: `color 180ms ${EASE}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
              >
                shuffle ∞
              </button>
            </div>
          </form>

          <div style={{ marginTop: 36 }}>
            <WaxSeal size={24} />
          </div>
        </div>
      </div>
    </ClothShell>
  );
}

/* ── a single cited source — quiet mono dim "— from <source>, <year>" line ── */
function Citation({ source }: { source: SourceEntry }) {
  const to = sourceHref(source);
  const snippet = stripMarks(source.snippet);
  // Resolve via the canonical dye→token source (dye.ts). `source.dye` is an
  // arbitrary string (dye id OR free-form category), so guard against DYES and
  // keep the honest blank for anything that is not a real palette dye.
  const dyeId = source.dye?.toLowerCase();
  const dyeColor =
    dyeId && DYES.includes(dyeId as Dye) ? dyeVar(dyeId as Dye) : undefined;
  return (
    <li style={{ margin: '0 0 8px' }}>
      <Link
        to={to}
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 8,
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 13,
          letterSpacing: '0.04em',
          color: 'var(--muted-2)',
          textDecoration: 'none',
          maxWidth: '100%',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-2)')}
      >
        {/* dye thread tick — shown only when a real dye is present, else honest blank */}
        {dyeColor && (
          <span
            aria-hidden
            style={{ width: 10, height: 2, alignSelf: 'center', flex: '0 0 auto', background: dyeColor }}
          />
        )}
        <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          — from <span style={{ fontStyle: 'italic' }}>{source.title ?? snippet ?? 'an untitled entry'}</span>
          {source.createdAt ? `, ${formatYear(source.createdAt)}` : ''}
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
