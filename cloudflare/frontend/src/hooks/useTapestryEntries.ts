import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';

/** One weft thread on the cloth — the shape every tapestry surface reads. */
export interface CanvasEntry {
  date: Date;
  n: number;
  dye: string;
  tier?: 'family' | 'descendants' | 'historian';
  author?: string;
  sealed?: boolean;
  sealUntil?: Date;
  /** The entry's own title — the cloth whispers it on hover. */
  title?: string;
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

/**
 * Shared tapestry data for TapestryCanvas across PwaHome and Weft.
 * Uses the same weft-* query keys as Weft.tsx so both surfaces share
 * one cache — invalidating after a write updates both instantly.
 */
export function useTapestryEntries(): { entries: CanvasEntry[]; isError: boolean; isLoading: boolean } {
  const { isAuthenticated } = useAuthStore();

  const { data: memoriesData, isError: me, isLoading: ml } = useQuery({
    queryKey: ['weft-memories'],
    queryFn: () => memoriesApi.getAll({ limit: 500 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const { data: lettersData, isError: le, isLoading: ll } = useQuery({
    queryKey: ['weft-letters'],
    queryFn: () => lettersApi.getAll({ limit: 500 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const { data: voiceData, isError: ve, isLoading: vl } = useQuery({
    queryKey: ['weft-voice'],
    queryFn: () => voiceApi.getAll({ limit: 500 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const isError = me || le || ve;
  // While any query is still in-flight the empty-state would flash; gate on this.
  const isLoading = ml || ll || vl;

  const entries = useMemo(() => {
    const mems: any[] = Array.isArray((memoriesData as any)?.data) ? (memoriesData as any).data : [];
    const lets: any[] = Array.isArray((lettersData as any)?.data) ? (lettersData as any).data : [];
    const vox: any[] = Array.isArray((voiceData as any)?.data) ? (voiceData as any).data : [];

    const all: CanvasEntry[] = [];
    let n = 0;

    for (const m of mems) {
      // The lived date the author assigned wins over the row's createdAt, so a memory
      // written today about 1995 weaves at 1995 on the cloth.
      const when = m.metadata?.entryDate ?? m.memory_date ?? m.createdAt ?? m.created_at;
      const date = new Date(when ?? Date.now());
      if (isNaN(date.getTime())) continue;
      all.push({
        date, n: n++, dye: pickDye(m.type ?? 'memory'), tier: 'family',
        author: m.userId ?? m.user_id,
        title: typeof m.title === 'string' && m.title ? m.title : undefined,
      });
    }
    for (const l of lets) {
      const date = new Date(l.createdAt ?? l.created_at ?? Date.now());
      if (isNaN(date.getTime())) continue;
      // A sealed letter with a future unlock date is a knot in the unwoven
      // future — the cloth shows it above the fell line.
      const unlockRaw = l.unlock_date ?? l.unlockDate ?? l.deliveryDate ?? l.delivery_date;
      const unlock = unlockRaw ? new Date(unlockRaw) : null;
      all.push({
        date, n: n++, dye: 'indigo', tier: 'family', sealed: !!l.sealedAt,
        sealUntil: unlock && !isNaN(unlock.getTime()) && unlock.getTime() > Date.now() ? unlock : undefined,
        title: typeof l.title === 'string' && l.title ? l.title : undefined,
      });
    }
    for (const v of vox) {
      const date = new Date(v.createdAt ?? v.created_at ?? Date.now());
      if (isNaN(date.getTime())) continue;
      all.push({
        date, n: n++, dye: 'saffron', tier: 'family',
        title: typeof v.title === 'string' && v.title ? v.title : undefined,
      });
    }

    return all.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [memoriesData, lettersData, voiceData]);

  return { entries, isError, isLoading };
}
