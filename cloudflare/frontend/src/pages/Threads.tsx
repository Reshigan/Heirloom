import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { threadsApi, type ThreadSummary } from '../services/api';

export function Threads() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [dedication, setDedication] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['threads'],
    queryFn: () => threadsApi.list().then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () =>
      threadsApi
        .create({
          name: name.trim(),
          dedication: dedication.trim() || undefined,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      setCreating(false);
      setName('');
      setDedication('');
      setError(null);
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      setError(err?.response?.data?.error ?? err?.message ?? 'Could not create thread.');
    },
  });

  const threads: ThreadSummary[] = data?.threads ?? [];

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          Family threads · {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          The threads you belong to.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          Each thread is append-only. Entries you add today can be locked for descendants who don't exist yet.
          Members across generations can read, comment, and add their own entries — but never alter what came before.
        </p>
      </header>

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : (
        <>
          {threads.length > 0 ? (
            <div style={{ marginBottom: 36 }}>
              {/* column header — typeset mono, hairline-ruled */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.9fr 0.7fr 0.6fr 0.6fr',
                  gap: 24,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--loom-rule-warm)',
                }}
              >
                <span className="loom-mono" style={COL_HEAD}>thread</span>
                <span className="loom-mono" style={COL_HEAD}>founded</span>
                <span className="loom-mono" style={COL_HEAD}>your role</span>
                <span className="loom-mono" style={{ ...COL_HEAD, textAlign: 'right' }}>members</span>
                <span className="loom-mono" style={{ ...COL_HEAD, textAlign: 'right' }}>entries</span>
              </div>
              {threads.map((t) => (
                <ThreadRow key={t.id} thread={t} />
              ))}
            </div>
          ) : null}

          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                marginBottom: 48,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--loom-warm)',
              }}
            >
              + begin a new thread →
            </button>
          ) : null}

          {creating ? (
            <div
              style={{
                border: '1px solid var(--loom-rule-warm)',
                padding: '32px 28px',
                marginBottom: 48,
              }}
            >
              <p
                className="loom-mono"
                style={{ margin: '0 0 24px', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--loom-warm)' }}
              >
                New thread
              </p>
              <div style={{ display: 'grid', gap: 20, maxWidth: 640 }}>
                <div>
                  <label
                    htmlFor="t-name"
                    className="loom-eyebrow"
                    style={{ display: 'block', marginBottom: 8 }}
                  >
                    Thread name
                  </label>
                  <input
                    id="t-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="The Mahmood family"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--loom-rule)',
                      color: 'var(--loom-bone)',
                      caretColor: 'var(--loom-warm)',
                      fontFamily: "'Source Serif 4', serif",
                      fontVariationSettings: "'opsz' 28",
                      fontSize: 20,
                      fontWeight: 300,
                      padding: '8px 0',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="t-ded"
                    className="loom-eyebrow"
                    style={{ display: 'block', marginBottom: 8 }}
                  >
                    Dedication — optional
                  </label>
                  <textarea
                    id="t-ded"
                    rows={3}
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    placeholder="A line your descendants will see when they open the thread for the first time."
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--loom-rule)',
                      color: 'var(--loom-bone)',
                      caretColor: 'var(--loom-warm)',
                      fontFamily: "'Source Serif 4', serif",
                      fontVariationSettings: "'opsz' 14",
                      fontSize: 16,
                      lineHeight: 1.75,
                      padding: '8px 0',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="loom-body"
                    style={{ margin: 0, fontStyle: 'italic', color: '#c25a5a', fontSize: 14 }}
                  >
                    {error}
                  </p>
                ) : null}

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => create.mutate()}
                    disabled={create.isPending || !name.trim()}
                    className="loom-btn"
                    style={{ opacity: create.isPending || !name.trim() ? 0.5 : 1 }}
                  >
                    {create.isPending ? 'beginning…' : 'begin thread'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setError(null);
                    }}
                    className="loom-btn-ghost"
                  >
                    cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {threads.length === 0 && !creating ? (
            <p
              className="loom-body"
              style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)', fontSize: 15 }}
            >
              No threads yet. Your first thread begins with your first entry — or name one yourself above.
            </p>
          ) : null}
        </>
      )}
    </AppFrame>
  );
}

const COL_HEAD: CSSProperties = {
  fontSize: 10,
  color: 'var(--loom-bone-faint)',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
};

/* ── One thread as a hairline-ruled mono table row (the design's ThreadsIndex) ── */
function ThreadRow({ thread }: { thread: ThreadSummary }) {
  const isFounder = thread.role === 'FOUNDER';
  return (
    <Link
      to={`/threads/${thread.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 0.9fr 0.7fr 0.6fr 0.6fr',
        gap: 24,
        padding: '20px 0',
        borderBottom: '1px solid var(--loom-rule)',
        alignItems: 'baseline',
        textDecoration: 'none',
      }}
    >
      {/* thread name (+ dedication as a quiet sub-line) */}
      <div>
        <span
          className="loom-serif"
          style={{ fontSize: 21, color: 'var(--loom-bone)', fontWeight: 400, letterSpacing: '-0.008em' }}
        >
          {thread.name}
        </span>
        {thread.dedication ? (
          <span
            className="loom-serif"
            style={{
              display: 'block',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--loom-bone-dim)',
              marginTop: 4,
              maxWidth: '52ch',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {thread.dedication}
          </span>
        ) : null}
      </div>

      {/* founded — created_at */}
      <span
        className="loom-mono"
        style={{ fontSize: 11, color: 'var(--loom-bone-dim)', letterSpacing: '0.06em' }}
      >
        {formatFounded(thread.created_at)}
      </span>

      {/* your role */}
      <span
        className="loom-mono"
        style={{
          fontSize: 10,
          color: isFounder ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        {thread.role.toLowerCase()}
      </span>

      {/* members */}
      <span
        className="loom-mono"
        style={{ fontSize: 13, color: 'var(--loom-bone-dim)', letterSpacing: '0.08em', textAlign: 'right' }}
      >
        {thread.member_count}
      </span>

      {/* entries */}
      <span
        className="loom-mono"
        style={{ fontSize: 13, color: 'var(--loom-bone)', letterSpacing: '0.08em', textAlign: 'right' }}
      >
        {thread.entry_count.toLocaleString()}
      </span>
    </Link>
  );
}

function formatFounded(iso: string): string {
  try {
    return new Date(iso)
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .toLowerCase();
  } catch {
    return iso;
  }
}
