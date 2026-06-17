import { useQuery } from '@tanstack/react-query';
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ['threads-index'],
    queryFn: () => threadsApi.list().then((r) => (r.data as any)?.threads ?? r.data ?? []),
    enabled: isAuthenticated,
  });

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
          backgroundImage: `linear-gradient(180deg, transparent 55%, var(--ink)), url(/woven/thread-band.png)`,
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

        <div style={{ marginTop: 64, paddingBottom: 40 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </ClothShell>
  );
}
