import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { HLogo } from '../loom/components/HLogo';
import { type LoomEntry, type LoomDye } from '../loom/components/Loom';
import { ViewToggle } from '../loom/components/ViewToggle';
import { EmptyThread } from '../loom/components/EmptyThread';
import { ProgressHair } from '../loom/components/ProgressHair';
import { WeftCentury } from '../loom/components/WeftCentury';
import { EntryRow, SectionLabel } from '../loom/cosmic/CosmicUI';
import { dyeVar } from '../loom/dye';
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

/** Compact uppercase mono date for the right-aligned row readout — "OCT 1947". */
function fmtRowDate(iso: string | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short', year: 'numeric',
    }).toUpperCase();
  } catch { return ''; }
}

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

  const { data: memoriesData, isLoading: memoriesLoading } = useQuery({
    queryKey: ['weft-memories'],
    queryFn: () => memoriesApi.getAll({ limit: 500 }).then((r) => r.data),
    enabled: isAuthenticated,
  });
  const { data: lettersData, isLoading: lettersLoading } = useQuery({
    queryKey: ['weft-letters'],
    queryFn: () => lettersApi.getAll({ limit: 500 }).then((r) => r.data),
    enabled: isAuthenticated,
  });
  const { data: voiceData, isLoading: voiceLoading } = useQuery({
    queryKey: ['weft-voice'],
    queryFn: () => voiceApi.getAll({ limit: 500 }).then((r) => r.data),
    enabled: isAuthenticated,
  });
  const { data: receivedData, isLoading: receivedLoading } = useQuery({
    queryKey: ['letters-received'],
    queryFn: () => lettersApi.received().then((r) => r.data).catch(() => null),
    enabled: isAuthenticated,
  });

  const isLoading = memoriesLoading || lettersLoading || voiceLoading || receivedLoading;

  const { data: threadMembersData } = useQuery({
    queryKey: ['weft-thread-members', user?.defaultThreadId],
    enabled: !!user?.defaultThreadId,
    queryFn: () =>
      threadsApi.listMembers(user!.defaultThreadId!)
        .then((r) => r.data?.members ?? [])
        .catch(() => []),
  });

  const { data: threadData } = useQuery({
    queryKey: ['weft-thread', user?.defaultThreadId],
    enabled: !!user?.defaultThreadId,
    queryFn: () => threadsApi.get(user!.defaultThreadId!).then((r) => r.data?.thread).catch(() => null),
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

  const handleSelectEntry = (entry: { id?: string; kind: string }) => {
    if (!entry.id) return;
    if (entry.kind === 'voice') navigate(`/loom/voice?id=${entry.id}`);
    else if (entry.kind === 'letter') navigate(`/loom/letter?id=${entry.id}`);
    else navigate(`/loom/read?entry=${entry.id}`);
  };

  const toggle = (
    <ViewToggle<WeftMode>
      value={mode}
      onChange={setMode}
      options={[
        { value: 'pull', label: 'threads' },
        { value: 'century', label: 'century' },
      ]}
    />
  );

  // The view toggle lives in the body (a right-aligned control over the
  // content), never the topbar — at 430px a 2-option toggle + UserMenu
  // overflowed the right column and clipped "THREADS" to "READS". The reference
  // tapestry has a clean topbar (wordmark + menu only); the toggle is ours.
  const toggleRow = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
      {toggle}
    </div>
  );

  if (mode === 'empty' || (!isLoading && entries.length === 0)) {
    return (
      <ClothShell
        topbarLeft={<HLogo size="sm" wordmark />}
        topbarRight={<UserMenu />}
        backdropOpacity={0.3}
      >
        {isLoading ? <ProgressHair /> : <EmptyThread onWeave={() => navigate('/compose')} onRecord={() => navigate('/record')} />}
      </ClothShell>
    );
  }

  const kinForCentury = (Array.isArray(threadMembersData) ? threadMembersData : []).map((m: any, i: number) => ({
    name: m.name ?? m.display_name ?? 'member',
    born: m.born_year ?? m.birthYear ?? new Date().getFullYear() - 30 - i * 10,
    died: m.died_year ?? null,
    you: m.user_id === user?.id || m.id === user?.id,
  }));

  // Derive user birth year from kin (the member flagged `you: true`).
  const youKin = kinForCentury.find((k) => k.you);
  const userBornYear = youKin?.born;

  if (mode === 'century') {
    return (
      <ClothShell
        topbarLeft={<HLogo size="sm" wordmark />}
        topbarRight={<UserMenu />}
        backdropOpacity={0.3}
      >
        <div style={{ position: 'relative', minHeight: '100%' }}>
          <div style={{ position: 'absolute', top: 16, right: 24, zIndex: 5 }}>{toggle}</div>
          <WeftCentury
            entries={allEntries}
            kin={kinForCentury}
            userBornYear={userBornYear}
            onSelectEntry={handleSelectEntry}
          />
        </div>
      </ClothShell>
    );
  }

  // Threads mode — "The Thread": the woven family thread (cosmic-thread mockup).
  // One chronological list, newest first, with faint decade dividers between groups.
  const recent = [...allEntries].reverse();

  // Eyebrow span — "THE VANCE THREAD · 1947–2026" from the bloodline name + year range.
  const years = allEntries.map((e) => e.year).filter((y) => Number.isFinite(y));
  const spanLo = years.length ? Math.min(...years) : null;
  const spanHi = years.length ? Math.max(...years) : null;
  // Strip a trailing "thread" so a stored "Vance Thread" never becomes "THE VANCE THREAD THREAD".
  const fam = (threadData?.name || '').trim().replace(/\s*thread$/i, '').trim();
  const label = fam ? `THE ${fam.toUpperCase()} THREAD` : 'THE THREAD';
  const eyebrow = (spanLo != null && spanHi != null
    ? `${label} · ${spanLo}–${spanHi}`
    : label) + (memberCount != null ? ` · ${memberCount} KIN` : '');

  // Decade of a year, e.g. 1998 → "1990s" — drives the faint year-divider labels.
  const decadeOf = (y: number) => `${Math.floor(y / 10) * 10}s`;

  // One-line dim subtitle: recipient for letters, else the kind, sentence-cased.
  const subOf = (entry: LoomEntry) => {
    if (entry.kind === 'letter' && entry.recipient) return `Letter to ${entry.recipient}`;
    if (entry.kind === 'letter') return 'A sealed letter';
    if (entry.kind === 'voice') return 'A voice note';
    return 'A woven memory';
  };

  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      topbarRight={<UserMenu />}
      backdropOpacity={0.3}
    >
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'transparent',
          padding: '64px 24px 96px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 460 }}>
          {/* The design carries no large "The Thread" H1 — only a centered
              copper eyebrow naming the bloodline and its year span. */}
          <div style={{ textAlign: 'center' }}>
            <SectionLabel tone="copper">{eyebrow}</SectionLabel>
          </div>

          {toggleRow}

          {/* The woven thread — each row is a quiet ledger entry: serif title on a
              neutral hairline left-filament, one-line Spectral subtitle, and a
              date-only right column; muted decade dividers. The member dye survives
              as the name tint on the title, not as a heavy left bar. */}
          <div>
            {recent.map((entry, i) => {
              const prev = recent[i - 1];
              const showDecade = !prev || decadeOf(prev.year) !== decadeOf(entry.year);
              // Per-member dye if the author set one, else the signature warm thread —
              // carried as the title tint, the surviving identity signal.
              const thread = entry.dye ? dyeVar(entry.dye) : 'var(--bone)';
              return (
                <div key={entry.id ?? `${entry.year}-${entry.month}-${entry.title}`}>
                  {showDecade && <SectionLabel>{decadeOf(entry.year)}</SectionLabel>}
                  <div style={{ borderLeft: '1px solid var(--hairline-3)', paddingLeft: 14 }}>
                    <EntryRow
                      italic={false}
                      title={
                        <>
                          {entry.locked ? <span style={{ color: 'var(--warm)', marginRight: 6 }}>∞</span> : null}
                          {entry.title || 'an entry'}
                        </>
                      }
                      sub={subOf(entry)}
                      year={fmtRowDate(entry.date)}
                      titleColor={thread}
                      subFont="serif"
                      subColor="var(--muted-2)"
                      dateColor="var(--muted-3)"
                      noBorder
                      onClick={() => handleSelectEntry(entry)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* The ∞ wax seal — the centered full-stop on the thread, no glow. */}
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <span style={{ color: 'var(--warm)', fontSize: 30, lineHeight: 1 }}>∞</span>
          </div>
        </div>
      </div>
    </ClothShell>
  );
}
