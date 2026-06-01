import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { threadsApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';
import { Link } from 'react-router-dom';

export function ThreadsIndex() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['threads-index'],
    queryFn: () => threadsApi.list().then((r) => (r.data as any)?.threads ?? r.data ?? []),
    enabled: isAuthenticated,
  });

  const threads = Array.isArray(data) ? data : [];

  return (
    <AppFrame left="threads">
      {isLoading && (
        <progress style={{ display: 'block', width: '100%', height: 1, marginBottom: 24, appearance: 'none', accentColor: 'var(--warm)' }} />
      )}

      <div style={{ paddingTop: 40 }}>
        {threads.length === 0 && !isLoading && (
          <p className="hl-serif" style={{ color: 'var(--bone-dim)', fontStyle: 'italic' }}>No threads yet.</p>
        )}

        {threads.map((thread: any, i: number) => (
          <Link
            key={thread.id ?? i}
            to={`/threads/${thread.id}`}
            style={{ display: 'block', textDecoration: 'none', borderBottom: '1px solid var(--rule)', padding: '20px 0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24 }}>
              <span className="hl-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)' }}>
                {thread.name ?? 'Unnamed Thread'}
              </span>
              <span style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {thread.memberCount ?? 1} {thread.memberCount === 1 ? 'member' : 'members'}
                </span>
                <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {thread.lastEntryAt ? new Date(thread.lastEntryAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </AppFrame>
  );
}
