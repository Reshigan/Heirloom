import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

const DYE_COLORS: Record<string, string> = {
  memory:    'var(--madder,   #9f3a2a)',
  letter:    'var(--indigo,   #1f3a5b)',
  voice:     'var(--saffron,  #c69a3a)',
  event:     'var(--weld,     #a89248)',
  milestone: 'var(--cochineal,#7a1f2b)',
};

export function Memories() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['memories-mosaic'],
    queryFn: () => memoriesApi.getAll({ limit: 200 }).then((r) => (r.data as any)?.memories ?? []),
    enabled: isAuthenticated,
  });

  const memories = (data as any[]) ?? [];

  return (
    <AppFrame
      left="memories"
      right={<span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.1em' }}>{memories.length} entries</span>}
    >
      {isLoading && (
        <progress style={{ width: '100%', height: 1, display: 'block', appearance: 'none', accentColor: 'var(--warm)' }} />
      )}

      <div style={{
        columns: 'var(--mosaic-cols, 3) auto',
        columnGap: 24,
        padding: '24px 0',
      }}>
        <style>{`
          @media (max-width: 900px) { :root { --mosaic-cols: 2 } }
          @media (max-width: 600px) { :root { --mosaic-cols: 1 } }
        `}</style>

        {memories.map((m: any) => (
          <div
            key={m.id}
            style={{
              breakInside: 'avoid',
              marginBottom: 24,
              paddingLeft: 12,
              borderLeft: `1px solid ${DYE_COLORS[m.type as string] ?? DYE_COLORS['memory']}`,
            }}
          >
            <div className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
              {new Date(m.createdAt ?? m.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: 0 }}>
              {(m.description as string)?.slice(0, 200)}{((m.description as string)?.length ?? 0) > 200 ? '…' : ''}
            </p>
          </div>
        ))}
      </div>
    </AppFrame>
  );
}
