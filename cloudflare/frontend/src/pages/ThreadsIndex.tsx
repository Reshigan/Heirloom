import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { threadsApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { dyeForId } from '../loom/dye';
import { ProgressHair } from '../loom/components/ProgressHair';
import { RoomHeader, RoomSection, RoomRow } from '../loom/components/room';

export function ThreadsIndex() {
  const { isAuthenticated } = useAuthStore();
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
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'min(100%, 720px)',
          margin: '0 auto',
        }}
      >
        <RoomHeader eyebrow="the threads" title="Every thread in the family." />

        <RoomSection flush>
          {isError && (
            <p style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 12, margin: 0, letterSpacing: '0.12em' }}>
              could not load threads
            </p>
          )}

          {threads.length === 0 && !isLoading && !isError && (
            <p className="hl-serif" style={{ color: 'var(--bone-dim)', fontStyle: 'italic' }}>No threads yet.</p>
          )}

          {threads.map((thread: any, i: number) => (
            <RoomRow
              key={thread.id ?? i}
              href={`/threads/${thread.id}`}
              dye={thread.id ? dyeForId(String(thread.id)) : undefined}
              title={thread.name ?? 'Unnamed Thread'}
              meta={
                <>
                  {thread.lastEntryAt ? new Date(thread.lastEntryAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
                  {' · '}
                  {thread.memberCount ?? 1} {thread.memberCount === 1 ? 'member' : 'members'}
                </>
              }
            />
          ))}
        </RoomSection>
      </div>
    </ClothShell>
  );
}
