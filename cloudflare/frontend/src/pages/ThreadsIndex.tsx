import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { threadsApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { Link } from 'react-router-dom';
import { dyeColor } from '../loom/dye';

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
        <progress style={{ display: 'block', width: '100%', height: 1, marginBottom: 24, appearance: 'none', accentColor: 'var(--warm)' }} />
      )}

      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-reading)',
          margin: '0 auto',
        }}
      >
        <div>
          {/* kicker */}
          <div
            className="hl-eyebrow"
            style={{ marginBottom: 16, color: 'var(--bone-faint)', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <span aria-hidden style={{ width: 6, height: 6, background: 'var(--warm)', display: 'block', flexShrink: 0 }} />
            the threads
          </div>

          {/* H1 */}
          <h1
            className="hl-serif hl-tight"
            style={{ fontSize: 'var(--type-display)', fontWeight: 300, margin: '0 0 32px', color: 'var(--bone)', lineHeight: 1.15 }}
          >
            Every thread in the family.
          </h1>

          {isError && (
            <p style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 12, margin: '0 0 24px', letterSpacing: '0.12em' }}>
              could not load threads
            </p>
          )}

          {threads.length === 0 && !isLoading && !isError && (
            <p className="hl-serif" style={{ color: 'var(--bone-dim)', fontStyle: 'italic' }}>No threads yet.</p>
          )}

          {threads.map((thread: any, i: number) => (
            <Link
              key={thread.id ?? i}
              to={`/threads/${thread.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '10px 1fr',
                gap: 16,
                alignItems: 'baseline',
                textDecoration: 'none',
                borderBottom: '1px solid var(--rule)',
                padding: '22px 0',
              }}
            >
              {/* dye square */}
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  background: thread.id ? dyeColor(String(thread.id)) : 'var(--warm)',
                  display: 'block',
                  flexShrink: 0,
                  transform: 'translateY(4px)',
                }}
              />
              {/* title + meta */}
              <div style={{ minWidth: 0 }}>
                <span className="hl-serif" style={{ display: 'block', fontSize: 'var(--type-subhead)', fontWeight: 300, color: 'var(--bone)', lineHeight: 1.3 }}>
                  {thread.name ?? 'Unnamed Thread'}
                </span>
                <span className="hl-mono" style={{ display: 'block', marginTop: 6, fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  {thread.lastEntryAt ? new Date(thread.lastEntryAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
                  {' · '}
                  {thread.memberCount ?? 1} {thread.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ClothShell>
  );
}
