import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import type { CanvasEntry } from '../loom/components/TapestryCanvas';

export function useTapestryEntries(): CanvasEntry[] {
  const { user, isAuthenticated } = useAuthStore();
  const threadId = user?.defaultThreadId ?? null;

  const { data } = useQuery({
    queryKey: ['tapestry-entries', threadId],
    queryFn: () =>
      memoriesApi.getAll({ limit: 500 }).then((r) => (r.data as any)?.data ?? []),
    enabled: isAuthenticated && !!threadId,
    staleTime: 30_000,
  });

  if (!data) return [];

  return (data as any[]).map((m: any, i: number) => ({
    date: new Date(m.createdAt ?? m.created_at ?? Date.now()),
    n: i,
    dye: pickDye(m.type ?? 'memory'),
    tier: 'family' as const,
    author: m.userId ?? m.user_id,
    sealed: !!m.lockedUntil,
    sealUntil: m.lockedUntil ? new Date(m.lockedUntil) : undefined,
  }));
}

const DYE_MAP: Record<string, string> = {
  memory: 'madder',
  letter: 'indigo',
  voice: 'saffron',
  event: 'weld',
  milestone: 'cochineal',
};

function pickDye(type: string): string {
  return DYE_MAP[type] ?? 'madder';
}
