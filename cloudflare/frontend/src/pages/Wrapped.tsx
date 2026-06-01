import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

const YEAR = new Date().getFullYear();

export default function Wrapped() {
  const { isAuthenticated } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['wrapped', YEAR],
    queryFn: () => memoriesApi.getAll({ limit: 500 }).then((r) => (r.data as any)?.memories ?? []),
    enabled: isAuthenticated,
  });

  const memories = (data as any[]) ?? [];
  const thisYear = memories.filter((m: any) => new Date(m.createdAt ?? m.created_at).getFullYear() === YEAR);
  const activeMonths = new Set(thisYear.map((m: any) => new Date(m.createdAt ?? m.created_at).getMonth())).size;

  return (
    <AppFrame left="wrapped">
      <div style={{ maxWidth: 600, padding: '64px 0' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 16 }}>{YEAR} · Heirloom Wrapped</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 52, fontWeight: 300, color: 'var(--bone)', margin: '0 0 64px', lineHeight: 1.04 }}>
          Another year<br />in the thread.
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderTop: '1px solid var(--rule)' }}>
          {([
            ['entries this year', String(thisYear.length)],
            ['months active', String(activeMonths)],
            ['total in thread', String(memories.length)],
            ['years running', String(YEAR - 2019)],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{ padding: '32px 32px 32px 0', borderBottom: '1px solid var(--rule)', borderRight: '1px solid var(--rule)' }}>
              <div className="hl-eyebrow" style={{ marginBottom: 8 }}>{label}</div>
              <div className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, color: 'var(--bone)', lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 48 }}>
          share this year's thread →
        </p>
      </div>
    </AppFrame>
  );
}
