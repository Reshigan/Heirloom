import { useEffect, useState } from 'react';
import { threadsApi } from '../../services/api';
import { CLOTH_BG_ENTRIES } from '../components/ClothShell';

// The 10 canonical natural-dye keys, mirrored from ClothCanvas3D
const DYE_KEYS = [
  'madder',
  'cochineal',
  'kermes',
  'saffron',
  'weld',
  'walnut',
  'oakgall',
  'woad',
  'indigo',
  'iron',
] as const;

type DyeKey = (typeof DYE_KEYS)[number];

/**
 * Deterministically map an author member ID to one of the 10 dye keys.
 * Uses a simple string-hash so the same author always gets the same dye.
 */
function getDyeForAuthor(authorId: string): DyeKey {
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = (hash * 31 + authorId.charCodeAt(i)) >>> 0;
  }
  return DYE_KEYS[hash % DYE_KEYS.length];
}

export type ClothEntryItem = {
  date: Date;
  dye: DyeKey;
  locked: boolean;
};

/**
 * Fetches real thread entries for a given threadId and maps them into
 * the ClothEntry format expected by ClothCanvas3D.
 *
 * Falls back to CLOTH_BG_ENTRIES (the deterministic mock) when:
 *  - threadId is null/undefined
 *  - the fetch fails
 *  - the API returns an empty array
 */
export function useClothEntries(
  threadId: string | null | undefined,
): ClothEntryItem[] {
  const [entries, setEntries] = useState<ClothEntryItem[]>(CLOTH_BG_ENTRIES);

  useEffect(() => {
    if (!threadId) return;

    threadsApi
      .listEntries(threadId)
      .then((r) => {
        const raw = r.data?.entries ?? [];
        if (raw.length === 0) return; // keep fallback if empty
        const mapped: ClothEntryItem[] = raw.map((entry) => ({
          date: new Date(entry.created_at),
          dye: getDyeForAuthor(entry.author_member_id),
          locked: entry.pending_lock != null,
        }));
        setEntries(mapped);
      })
      .catch(() => {}); // silent fallback to mock
  }, [threadId]);

  return entries;
}
