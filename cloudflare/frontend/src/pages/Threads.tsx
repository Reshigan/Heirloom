import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Frame, TapestryEdge } from '../loom/components/Frame';
import { threadsApi, type ThreadSummary } from '../services/api';

export function Threads() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      setCreating(false);
      setName('');
      setDedication('');
      setError(null);
      if (result?.thread?.id) {
        navigate(`/threads/${result.thread.id}`);
      }
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      setError(err?.response?.data?.error ?? err?.message ?? 'Could not create thread.');
    },
  });

  const threads: ThreadSummary[] = data?.threads ?? [];

  return (
    <Frame
      left="threads"
      right={<Link to="/loom" className="hl-link warm">the loom →</Link>}
    >
      {/* scrollable content area */}
      <div
        style={{
          padding: 'clamp(16px, 4vw, 56px)',
          paddingBottom: 80,
          overflowX: 'hidden',
        }}
      >
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 'clamp(28px, 6vw, 44px)',
            fontWeight: 300,
            letterSpacing: '-0.022em',
            marginBottom: 32,
            marginTop: 0,
            color: 'var(--bone)',
          }}
        >
          The threads you hold.
        </h1>

        {isLoading ? (
          <p
            className="hl-mono"
            style={{
              fontSize: 11,
              color: 'var(--bone-faint)',
              textAlign: 'center',
              letterSpacing: '0.1em',
              marginTop: 80,
            }}
          >
            loading…
          </p>
        ) : (
          <>
            {threads.length > 0 ? (
              <div style={{ marginBottom: 48 }}>
                <style>{`
                  .threads-row { grid-template-columns: 2fr 1.4fr 0.9fr 0.7fr 0.6fr; }
                  @media (max-width: 600px) {
                    .threads-row { grid-template-columns: 1fr auto; }
                    .threads-col-hide { display: none; }
                  }
                `}</style>
                {/* column headers */}
                <div
                  className="threads-row"
                  style={{
                    display: 'grid',
                    borderBottom: '1px solid var(--rule)',
                    paddingBottom: 12,
                  }}
                >
                  {(['thread', 'entries', 'members', 'last entry', ''] as const).map((col) => (
                    <span
                      key={col}
                      className={`hl-mono${col !== 'thread' && col !== '' ? ' threads-col-hide' : ''}`}
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.22em',
                        color: 'var(--bone-faint)',
                      }}
                    >
                      {col}
                    </span>
                  ))}
                </div>

                {/* data rows */}
                {threads.map((t) => (
                  <ThreadRow key={t.id} thread={t} />
                ))}
              </div>
            ) : null}

            {threads.length === 0 && !creating ? (
              <p
                className="hl-serif hl-italic"
                style={{
                  fontSize: 17,
                  color: 'var(--bone-dim)',
                  marginBottom: 48,
                }}
              >
                no threads yet
              </p>
            ) : null}

            {/* new thread trigger */}
            {!creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="hl-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                }}
              >
                begin a new thread →
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* create dialog overlay */}
      {creating ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(14,14,12,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#131310',
              border: '1px solid var(--rule-strong)',
              padding: '36px 40px',
              maxWidth: 480,
              width: '100%',
            }}
          >
            <p
              className="hl-mono"
              style={{
                margin: '0 0 28px',
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
              }}
            >
              new thread
            </p>

            <div style={{ display: 'grid', gap: 24 }}>
              <div>
                <label
                  htmlFor="t-name"
                  className="hl-eyebrow"
                  style={{ display: 'block', marginBottom: 8 }}
                >
                  Thread name
                </label>
                <input
                  id="t-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="The Mahmood family"
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid var(--rule)',
                    color: 'var(--bone)',
                    caretColor: 'var(--warm)',
                    fontFamily: 'var(--serif)',
                    fontVariationSettings: "'opsz' 28",
                    fontSize: 17,
                    fontWeight: 300,
                    padding: '8px 0',
                    outline: 'none',
                    boxSizing: 'border-box',
                    borderRadius: 0,
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="t-ded"
                  className="hl-eyebrow"
                  style={{ display: 'block', marginBottom: 8 }}
                >
                  Dedication — optional
                </label>
                <input
                  id="t-ded"
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="A line your descendants will read first."
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid var(--rule)',
                    color: 'var(--bone)',
                    caretColor: 'var(--warm)',
                    fontFamily: 'var(--serif)',
                    fontVariationSettings: "'opsz' 14",
                    fontSize: 17,
                    fontWeight: 300,
                    padding: '8px 0',
                    outline: 'none',
                    boxSizing: 'border-box',
                    borderRadius: 0,
                  }}
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="hl-mono"
                  style={{ margin: 0, fontSize: 11, color: '#c25a5a', letterSpacing: '0.04em' }}
                >
                  {error}
                </p>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => create.mutate()}
                  disabled={create.isPending || !name.trim()}
                  className="hl-btn"
                  style={{ opacity: create.isPending || !name.trim() ? 0.45 : 1 }}
                >
                  {create.isPending ? 'creating…' : 'create thread'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setError(null);
                  }}
                  className="hl-mono"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                  }}
                >
                  cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <TapestryEdge />
    </Frame>
  );
}

/* ── Single thread data row ─────────────────────────────────────────────── */
function ThreadRow({ thread }: { thread: ThreadSummary }) {
  const dyeKey = (thread as ThreadSummary & { dye?: string }).dye ?? 'walnut';
  return (
    <div
      className="threads-row"
      style={{
        display: 'grid',
        borderBottom: '1px solid var(--rule)',
        paddingTop: 14,
        paddingBottom: 14,
        alignItems: 'center',
      }}
    >
      {/* thread name */}
      <Link
        to={`/threads/${thread.id}`}
        className="hl-serif"
        style={{
          fontSize: 16,
          fontWeight: 300,
          color: 'var(--warm)',
          textDecoration: 'none',
          letterSpacing: '-0.008em',
        }}
      >
        {thread.name}
      </Link>

      {/* entry count */}
      <span
        className="hl-mono threads-col-hide"
        style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.06em' }}
      >
        {thread.entry_count.toLocaleString()}
      </span>

      {/* member count */}
      <span
        className="hl-mono threads-col-hide"
        style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.06em' }}
      >
        {thread.member_count}
      </span>

      {/* last entry / created_at */}
      <span
        className="hl-mono threads-col-hide"
        style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}
      >
        {formatDate(thread.created_at)}
      </span>

      {/* dye swatch */}
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 14,
          height: 2,
          background: `var(--dye-${dyeKey})`,
        }}
      />
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso)
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .toLowerCase();
  } catch {
    return iso;
  }
}
