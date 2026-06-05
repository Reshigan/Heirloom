import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import type { CanvasEntry } from '../loom/components/TapestryCanvas';

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

/**
 * Shared tapestry data for TapestryCanvas across PwaHome and Weft.
 * Uses the same weft-* query keys as Weft.tsx so both surfaces share
 * one cache — invalidating after a write updates both instantly.
 */
export function useTapestryEntries(): CanvasEntry[] {
  const { isAuthenticated } = useAuthStore();

  const { data: memoriesData } = useQuery({
    queryKey: ['weft-memories'],
    queryFn: () => memoriesApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
    enabled: isAuthenticated,
  });

  const { data: lettersData } = useQuery({
    queryKey: ['weft-letters'],
    queryFn: () => lettersApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
    enabled: isAuthenticated,
  });

  const { data: voiceData } = useQuery({
    queryKey: ['weft-voice'],
    queryFn: () => voiceApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
    enabled: isAuthenticated,
  });

  return useMemo(() => {
    const mems: any[] = Array.isArray((memoriesData as any)?.data) ? (memoriesData as any).data : [];
    const lets: any[] = Array.isArray((lettersData as any)?.data) ? (lettersData as any).data : [];
    const vox: any[] = Array.isArray((voiceData as any)?.data) ? (voiceData as any).data : [];

    const all: CanvasEntry[] = [];
    let n = 0;

    for (const m of mems) {
      const date = new Date(m.createdAt ?? m.created_at ?? m.memory_date ?? Date.now());
      if (isNaN(date.getTime())) continue;
      all.push({ date, n: n++, dye: pickDye(m.type ?? 'memory'), tier: 'family', author: m.userId ?? m.user_id });
    }
    for (const l of lets) {
      const date = new Date(l.createdAt ?? l.created_at ?? Date.now());
      if (isNaN(date.getTime())) continue;
      all.push({ date, n: n++, dye: 'indigo', tier: 'family', sealed: !!l.sealedAt });
    }
    for (const v of vox) {
      const date = new Date(v.createdAt ?? v.created_at ?? Date.now());
      if (isNaN(date.getTime())) continue;
      all.push({ date, n: n++, dye: 'saffron', tier: 'family' });
    }

    return all.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [memoriesData, lettersData, voiceData]);
}
