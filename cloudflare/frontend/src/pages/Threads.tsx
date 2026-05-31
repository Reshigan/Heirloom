import { useState } from 'react';
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 1,
              marginBottom: 48,
              border: '1px solid var(--loom-rule)',
            }}
          >
            {threads.map((t) => (
              <ThreadCard key={t.id} thread={t} />
            ))}

            {!creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: '32px 28px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderLeft: threads.length > 0 ? '1px solid var(--loom-rule)' : 0,
                  color: 'var(--loom-bone-faint)',
                  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--loom-bone-dim)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--loom-bone-faint)'; }}
              >
                <p
                  className="loom-mono"
                  style={{ margin: '0 0 12px', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase' }}
                >
                  + begin a new thread
                </p>
                <p
                  className="loom-serif"
                  style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 300 }}
                >
                  Start a new thread
                </p>
                <p
                  className="loom-body"
                  style={{ margin: 0, fontSize: 14, color: 'var(--loom-bone-faint)', lineHeight: 1.6 }}
                >
                  For a different bloodline, an in-laws line, or a chosen family.
                </p>
              </button>
            ) : null}
          </div>

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

function ThreadCard({ thread }: { thread: ThreadSummary }) {
  return (
    <Link
      to={`/threads/${thread.id}`}
      style={{
        display: 'block',
        padding: '32px 28px',
        textDecoration: 'none',
        borderRight: '1px solid var(--loom-rule)',
        transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(244,236,216,0.02)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
    >
      <p
        className="loom-mono"
        style={{
          margin: '0 0 12px',
          fontSize: 10,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--loom-warm)',
        }}
      >
        {thread.role.toLowerCase()} · gen {thread.generation_offset}
      </p>
      <h2
        className="loom-serif"
        style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 300, color: 'var(--loom-bone)', lineHeight: 1.2 }}
      >
        {thread.name}
      </h2>
      {thread.dedication ? (
        <p
          className="loom-body"
          style={{
            margin: '0 0 20px',
            fontSize: 14,
            color: 'var(--loom-bone-dim)',
            lineHeight: 1.65,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {thread.dedication}
        </p>
      ) : (
        <div style={{ height: 20 }} />
      )}
      <p
        className="loom-mono"
        style={{ margin: 0, fontSize: 11, letterSpacing: '0.04em', color: 'var(--loom-bone-faint)' }}
      >
        · {thread.entry_count} {thread.entry_count === 1 ? 'entry' : 'entries'} &nbsp;·&nbsp; {thread.member_count} {thread.member_count === 1 ? 'member' : 'members'}
      </p>
    </Link>
  );
}
