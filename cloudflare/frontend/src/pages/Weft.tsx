import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { HLogo } from '../loom/components/HLogo';
import { type LoomEntry, type LoomDye } from '../loom/components/Loom';
import { ViewToggle } from '../loom/components/ViewToggle';
import { EmptyThread } from '../loom/components/EmptyThread';
import { WeftPull } from '../loom/components/WeftPull';
import { WeftCentury } from '../loom/components/WeftCentury';
import { memoriesApi, lettersApi, voiceApi, threadsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeFromMetadata } from '../loom/dye';

/**
 * Screen 02 — The Weft
 *
 * The user's life as a horizontal woven band. Fetches real data from
 * the memories, letters, and voice APIs; falls back to the EmptyThread
 * warp-only view when the cloth has no picks yet.
 *
 * Three view-modes (ViewToggle in top bar):
 *   pull    — one thread at a time, vertical paging (WeftPull) [default]
 *   century — the whole archive compressed (WeftCentury)
 *   empty   — warp-only, forced (for reviewers)
 *
 * Token audit (2.1): ambientShuttle confirmed, EmptyThread on empty state
 * confirmed, zero raw hex colors, zero icon-library imports.
 */
type WeftMode = 'pull' | 'century' | 'empty';

/** The author-assigned dye if it's a real palette stop, else undefined (kind default). */
const dyeOf = (metadata: any): LoomDye | undefined => dyeFromMetadata(metadata) as LoomDye | undefined;

/** First recipient name on a letter, for the highlight readout. */
function recipientOf(l: any): string | undefined {
  const r = Array.isArray(l.recipients) ? l.recipients[0] : null;
  return r?.name || (typeof l.salutation === 'string' ? l.salutation.replace(/[,:\s]+$/, '') : undefined) || undefined;
}

function toEntries(
  memories: any[],
  letters: any[],
  voice: any[],
): LoomEntry[] {
  const all: LoomEntry[] = [];
  let lane = 0;

  for (const m of memories) {
    const d = new Date(m.metadata?.entryDate || m.memory_date || m.createdAt || m.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({
      id: m.id, year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'memory',
      title: m.title?.trim() || 'a memory', date: d.toISOString(), dye: dyeOf(m.metadata),
    });
  }
  for (const l of letters) {
    const d = new Date(l.metadata?.entryDate || l.createdAt || l.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({
      id: l.id, year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'letter',
      locked: !!l.sealedAt, title: l.title?.trim() || l.salutation?.trim() || 'a letter',
      date: d.toISOString(), recipient: recipientOf(l), dye: dyeOf(l.metadata),
    });
  }
  for (const v of voice) {
    const d = new Date(v.metadata?.entryDate || v.createdAt || v.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({
      id: v.id, year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'voice',
      title: v.title?.trim() || 'a voice note', date: d.toISOString(), dye: dyeOf(v.metadata),
    });
  }

  return all.sort((a, b) => (a.year * 12 + (a.month ?? 1)) - (b.year * 12 + (b.month ?? 1)));
}

export function Weft() {
  const [mode, setMode] = useState<WeftMode>('pull');
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const { data: memoriesData } = useQuery({
    queryKey: ['weft-memories'],
    queryFn: () => memoriesApi.getAll({ limit: 500 }).then((r) => r.data),
    enabled: isAuthenticated,
  });
  const { data: lettersData } = useQuery({
    queryKey: ['weft-letters'],
    queryFn: () => lettersApi.getAll({ limit: 500 }).then((r) => r.data),
    enabled: isAuthenticated,
  });
  const { data: voiceData } = useQuery({
    queryKey: ['weft-voice'],
    queryFn: () => voiceApi.getAll({ limit: 500 }).then((r) => r.data),
    enabled: isAuthenticated,
  });
  const { data: receivedData } = useQuery({
    queryKey: ['letters-received'],
    queryFn: () => lettersApi.received().then((r) => r.data).catch(() => null),
    enabled: isAuthenticated,
  });

  const { data: threadMembersData } = useQuery({
    queryKey: ['weft-thread-members', user?.defaultThreadId],
    enabled: !!user?.defaultThreadId,
    queryFn: () =>
      threadsApi.listMembers(user!.defaultThreadId!)
        .then((r) => r.data?.members ?? [])
        .catch(() => []),
  });

  const allEntries = useMemo(() => {
    const mems = Array.isArray((memoriesData as any)?.data) ? (memoriesData as any).data : [];
    const lets = Array.isArray((lettersData as any)?.data) ? (lettersData as any).data : [];
    const vox = Array.isArray((voiceData as any)?.data) ? (voiceData as any).data : [];
    const received = (Array.isArray((receivedData as any)?.data) ? (receivedData as any).data : []).map((r: any) => ({
      id: r.id,
      title: r.title || 'a letter',
      salutation: r.salutation,
      createdAt: r.deliveredAt || r.createdAt,
      sealedAt: null,
      recipients: [{ name: r.from }],
      metadata: null,
    }));
    return toEntries(mems, [...lets, ...received], vox);
  }, [memoriesData, lettersData, voiceData, receivedData]);

  const entries = mode === 'empty' ? [] : allEntries;

  const memberCount = Array.isArray(threadMembersData) ? threadMembersData.length : null;
  const entryCount = (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textTransform: 'uppercase' }}>
      {allEntries.length} entries{memberCount != null ? ` · ${memberCount} members` : ''}
    </span>
  );

  const toggle = (
    <ViewToggle<WeftMode>
      value={mode}
      onChange={setMode}
      options={[
        { value: 'pull', label: 'pull' },
        { value: 'century', label: 'century' },
        { value: 'empty', label: 'empty' },
      ]}
    />
  );

  const rightSlot = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {toggle}
      <UserMenu />
    </div>
  );

  if (mode === 'empty' || entries.length === 0) {
    return (
      <ClothShell
        topbarLeft={<HLogo size="sm" wordmark />}
        topbarCenter="the tapestry"
        topbarRight={rightSlot}
        backdropOpacity={0.3}
      >
        <EmptyThread onWeave={() => navigate('/compose')} onRecord={() => navigate('/record')} />
      </ClothShell>
    );
  }

  const kinForCentury = (Array.isArray(threadMembersData) ? threadMembersData : []).map((m: any, i: number) => ({
    name: m.name ?? m.display_name ?? 'member',
    born: m.born_year ?? m.birthYear ?? new Date().getFullYear() - 30 - i * 10,
    died: m.died_year ?? null,
    you: m.user_id === user?.id || m.id === user?.id,
  }));

  if (mode === 'century') {
    return (
      <ClothShell
        topbarLeft={<HLogo size="sm" wordmark />}
        topbarCenter="the tapestry"
        topbarRight={rightSlot}
        backdropOpacity={0.3}
      >
        <WeftCentury entries={allEntries} kin={kinForCentury} />
      </ClothShell>
    );
  }

  // Default: pull mode
  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      topbarCenter="the tapestry"
      topbarRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {entryCount}
          {toggle}
          <UserMenu />
        </div>
      }
      backdropOpacity={0.3}
    >
      <WeftPull entries={allEntries} />
    </ClothShell>
  );
}
