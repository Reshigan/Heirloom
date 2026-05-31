import { useState } from 'react';
import { searchApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

/**
 * QandA — Loom-native "Q&A (RAG, cited)".
 *
 * Ask a question of the family thread; the Listener answers from the
 * entries you are allowed to read, and cites every claim back to a
 * specific entry. The answer is rendered as quiet Source Serif 4
 * prose with the citations as mono links beneath — never a chatbot
 * bubble (§1.5C, the Listener is one typographic surface).
 *
 * ── Honesty caveat ──────────────────────────────────────────────
 * There is NO retrieval-augmented generation / "ask the archive"
 * endpoint in the API yet (inspected services/api.ts → aiApi has
 * prompt/future-letter/interview/transcribe only; no /ai/ask, /qa,
 * /rag; the worker has no citation route). Rather than fabricate a
 * synthesised answer and fake citations, this page wires the closest
 * REAL call — searchApi.search (FTS over your own memories / voice /
 * letters) — and surfaces the genuine matching entries as the cited
 * sources the question touches. The Listener panel states plainly
 * that woven, cited answers are not yet generated for your thread;
 * it never invents prose. When a real RAG endpoint lands, only the
 * `runQuery` body and the answer block need to change.
 */

interface SourceEntry {
  id: string;
  type: string; // 'memory' | 'voice' | 'letter'
  subType?: string;
  title: string | null;
  snippet: string | null;
  createdAt: string | null;
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
    <AppFrame>
      <header style={{ marginBottom: 36 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          Q&amp;A · the listener invited
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          Ask the thread.
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
          The Listener can only draw from entries you are allowed to read. It does not invent; it
          cites every claim back to a specific entry. Sealed notes are never visible to it.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 56 }}>
        {/* ── ask + answer column ── */}
        <div style={{ minWidth: 0 }}>
          <form onSubmit={onSubmit} style={{ borderBottom: '1px solid var(--loom-rule)', paddingBottom: 16 }}>
            <label
              className="loom-serif"
              htmlFor="qanda-input"
              style={{
                display: 'block',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--loom-bone-dim)',
                marginBottom: 8,
                fontWeight: 400,
              }}
            >
              ask the thread
            </label>
            <input
              id="qanda-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What did Grandma say about the kitchen?"
              className="loom-serif"
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                outline: 'none',
                color: 'var(--loom-bone)',
                fontSize: 'clamp(22px, 3vw, 30px)',
                fontWeight: 300,
                letterSpacing: '-0.014em',
                lineHeight: 1.2,
                padding: 0,
                borderRadius: 2,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                type="submit"
                className="loom-btn"
                disabled={state.phase === 'asking' || question.trim().length < 2}
                style={{ opacity: question.trim().length < 2 ? 0.5 : 1 }}
              >
                {state.phase === 'asking' ? 'asking…' : 'ask'}
              </button>
            </div>
          </form>

          {state.phase === 'asking' && <Shuttle />}

          {state.phase === 'error' && (
            <p
              className="loom-body"
              style={{ marginTop: 28, fontSize: 15, color: '#c25a5a', fontStyle: 'italic' }}
            >
              The thread could not be reached. Try the question again.
            </p>
          )}

          {state.phase === 'answered' && (
            <div style={{ marginTop: 32 }}>
              <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
                the listener
              </p>

              {/* Honest answer surface — quiet serif prose, no invented claims. */}
              <p
                className="loom-body"
                style={{ fontSize: 17, lineHeight: 1.85, color: 'var(--loom-bone)', maxWidth: '64ch', margin: 0 }}
              >
                {state.sources.length > 0 ? (
                  <>
                    The thread holds{' '}
                    <span style={{ color: 'var(--loom-warm)' }}>
                      {state.sources.length} {state.sources.length === 1 ? 'entry' : 'entries'}
                    </span>{' '}
                    that touch <em>“{state.question}”</em>. They are cited below, each opening to the
                    entry it came from.
                  </>
                ) : (
                  <>Nothing in the entries you can read speaks to <em>“{state.question}”</em> yet.</>
                )}
              </p>

              <p
                className="loom-body"
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--loom-bone-dim)',
                  maxWidth: '64ch',
                  marginTop: 16,
                  fontStyle: 'italic',
                }}
              >
                The Listener does not yet compose a woven, cited answer for your thread — that
                surface is coming. For now it will only show you the true entries your question
                touches, never words it has invented.
              </p>

              {state.sources.length > 0 && (
                <div style={{ marginTop: 30 }}>
                  <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
                    cited entries · {state.sources.length}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {state.sources.map((s, i) => (
                      <Citation key={s.id} index={i + 1} source={s} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {state.phase === 'idle' && (
            <p
              className="loom-body"
              style={{
                marginTop: 28,
                fontSize: 15,
                lineHeight: 1.8,
                color: 'var(--loom-bone-faint)',
                fontStyle: 'italic',
                maxWidth: '60ch',
              }}
            >
              Ask anything of the thread. The Listener will find the entries that answer it and cite
              each one.
            </p>
          )}
        </div>

        {/* ── try also / the rules ── */}
        <aside>
          <p className="loom-eyebrow" style={{ marginBottom: 16 }}>
            try also
          </p>
          <div style={{ display: 'grid', gap: 2 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void runQuery(s)}
                className="loom-serif"
                style={{
                  textAlign: 'left',
                  background: 'transparent',
                  border: 0,
                  borderBottom: '1px solid var(--loom-rule)',
                  padding: '12px 0',
                  color: 'var(--loom-bone-dim)',
                  fontSize: 14.5,
                  lineHeight: 1.5,
                  cursor: 'pointer',
                  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--loom-warm)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--loom-bone-dim)')}
              >
                · {s}
              </button>
            ))}
          </div>

          <hr className="loom-hairline" style={{ margin: '28px 0' }} />

          <p
            className="loom-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              marginBottom: 10,
            }}
          >
            the rules of the listener
          </p>
          <p
            className="loom-serif"
            style={{
              fontSize: 13.5,
              lineHeight: 1.7,
              color: 'var(--loom-bone-dim)',
              fontStyle: 'italic',
              fontWeight: 400,
              margin: 0,
            }}
          >
            The listener can only answer from entries you are allowed to read. It does not invent. It
            cites every claim. Sealed notes are not visible to it.
          </p>
        </aside>
      </div>
    </AppFrame>
  );
}

/* ── a single cited source entry ── */
function Citation({ index, source }: { index: number; source: SourceEntry }) {
  const href = sourceHref(source);
  const snippet = stripMarks(source.snippet);
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '30px 96px 1fr 88px',
        gap: 14,
        padding: '12px 0',
        borderTop: '1px solid var(--loom-rule)',
        alignItems: 'baseline',
      }}
    >
      <span className="loom-mono" style={{ color: 'var(--loom-warm)', fontSize: 10.5 }}>
        [{index}]
      </span>
      <span
        className="loom-mono"
        style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--loom-bone-faint)' }}
      >
        {source.createdAt ? formatDate(source.createdAt) : '—'}
      </span>
      <a
        href={href}
        className="loom-serif"
        style={{ fontSize: 14.5, color: 'var(--loom-bone)', fontWeight: 400, textDecoration: 'none' }}
      >
        {source.title ?? 'Untitled entry'}
        {snippet ? (
          <span
            className="loom-serif"
            style={{ display: 'block', fontStyle: 'italic', fontSize: 12.5, color: 'var(--loom-bone-dim)', marginTop: 2 }}
          >
            {snippet}
          </span>
        ) : null}
      </a>
      <span
        className="loom-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          color: 'var(--loom-bone-faint)',
          textAlign: 'right',
          textTransform: 'lowercase',
        }}
      >
        {source.subType ?? source.type}
      </span>
    </li>
  );
}

/* ── the only permitted "loading" affordance: a 1px shuttle bar ── */
function Shuttle() {
  return (
    <div
      style={{
        marginTop: 28,
        height: 1,
        background: 'var(--loom-rule)',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-label="Asking the thread"
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 1,
          width: '40%',
          background: 'color-mix(in srgb, var(--loom-warm) 40%, transparent)',
          animation: 'loom-shuttle 1.4s var(--loom-ease) infinite',
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
