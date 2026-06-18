import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { threadsApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { dyeForId } from '../loom/dye';
import { ProgressHair } from '../loom/components/ProgressHair';
import { CosmicHeader, EntryRow, WaxSeal } from '../loom/cosmic/CosmicUI';

export function ThreadsIndex() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['threads-index'],
    queryFn: () => threadsApi.list().then((r) => (r.data as any)?.threads ?? r.data ?? []),
    enabled: isAuthenticated,
  });

  const create = useMutation({
    mutationFn: () =>
      threadsApi.create({ name: newName.trim(), default_visibility: 'FAMILY' }).then((r) => r.data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['threads-index'] });
      const id = res?.thread?.id;
      if (id) navigate(`/threads/${id}`);
      else {
        setCreating(false);
        setNewName('');
      }
    },
    onError: () => {
      /* error surfaced inline via create.error below */
    },
  });

  const createError = create.error as
    | { response?: { data?: { error?: string } }; message?: string }
    | null;
  const upgradeMessage =
    createError?.response?.data?.error ?? createError?.message ?? null;

  const threads = Array.isArray(data) ? data : [];

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'today', to: '/loom/today' }, { label: 'threads' }]} />}
    >
      {isLoading && (
        <div style={{ marginBottom: 24 }}>
          <ProgressHair />
        </div>
      )}

      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 240,
          backgroundImage: `linear-gradient(180deg, transparent 55%, var(--ink)), image-set(url("/woven/thread-band.avif") type("image/avif"), url("/woven/thread-band.webp") type("image/webp"), url("/woven/thread-band.png") type("image/png"))`,
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat',
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'min(100%, 720px)',
          margin: '0 auto',
        }}
      >
        <CosmicHeader
          eyebrow={isLoading ? 'THREADS' : `${threads.length} THREAD${threads.length === 1 ? '' : 'S'}`}
          title="Every thread in the family."
        />

        {isError && (
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
              margin: '0 0 24px',
            }}
          >
            could not load threads
          </p>
        )}

        {threads.length === 0 && !isLoading && !isError && (
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 19,
              color: 'var(--bone-dim)',
              margin: '32px 0 48px',
            }}
          >
            No threads yet. Weave the first one.
          </p>
        )}

        <div>
          {threads.map((thread: any, i: number) => {
            const dye = thread.id ? dyeForId(String(thread.id)) : undefined;
            const lastYear = thread.lastEntryAt
              ? String(new Date(thread.lastEntryAt).getFullYear())
              : undefined;
            const memberLabel = thread.memberCount != null
              ? `${thread.memberCount} ${thread.memberCount === 1 ? 'MEMBER' : 'MEMBERS'}`
              : undefined;

            return (
              <EntryRow
                key={thread.id ?? i}
                title={thread.name ?? 'Unnamed Thread'}
                sub={memberLabel}
                year={lastYear}
                dye={dye}
                onClick={() => navigate(`/threads/${thread.id}`)}
              />
            );
          })}
        </div>

        <div style={{ marginTop: 40, borderTop: '1px solid var(--rule)', paddingTop: 28 }}>
          {!creating ? (
            <button
              type="button"
              onClick={() => {
                create.reset();
                setCreating(true);
              }}
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 12,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                transition: 'color 360ms var(--ease, cubic-bezier(0.16,1,0.3,1))',
              }}
            >
              Begin a new thread
            </button>
          ) : (
            <div>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim() && !create.isPending) create.mutate();
                  if (e.key === 'Escape') {
                    setCreating(false);
                    setNewName('');
                    create.reset();
                  }
                }}
                placeholder="Name this thread"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 0,
                  borderBottom: '1px solid var(--rule)',
                  padding: '8px 0',
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: 'var(--bone)',
                  outline: 'none',
                }}
              />
              {create.isPending && (
                <div style={{ marginTop: 16 }}>
                  <ProgressHair />
                </div>
              )}
              <div style={{ display: 'flex', gap: 28, marginTop: 20, alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={!newName.trim() || create.isPending}
                  onClick={() => create.mutate()}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: !newName.trim() || create.isPending ? 'default' : 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: !newName.trim() || create.isPending ? 'var(--bone-faint)' : 'var(--warm)',
                  }}
                >
                  Weave it
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setNewName('');
                    create.reset();
                  }}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-dim)',
                  }}
                >
                  Cancel
                </button>
              </div>
              {upgradeMessage && (
                <p
                  style={{
                    fontFamily: 'var(--serif)',
                    fontStyle: 'italic',
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: 'var(--warm)',
                    margin: '20px 0 0',
                  }}
                >
                  {upgradeMessage}{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/billing')}
                    style={{
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--warm-bright)',
                      borderBottom: '1px solid currentColor',
                      lineHeight: 1.2,
                    }}
                  >
                    See plans
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 64, paddingBottom: 40 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </ClothShell>
  );
}
