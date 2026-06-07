import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { LettersAwaitingMe } from '../loom/components/LettersAwaitingMe';
import { HLogo } from '../loom/components/HLogo';
import { type LoomEntry, type LoomDye, type LoomKind } from '../loom/components/Loom';
import { TapestryCanvas, type CanvasEntry } from '../loom/components/TapestryCanvas';
import { BOTTOM_NAV_CLEARANCE } from '../loom/components/BottomNav';
import { ViewToggle } from '../loom/components/ViewToggle';
import { EmptyThread } from '../loom/components/EmptyThread';
import { WeftPull } from '../loom/components/WeftPull';
import { WeftCentury } from '../loom/components/WeftCentury';
import { memoriesApi, lettersApi, voiceApi, threadsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useListener } from '../hooks/useListener';
import { dyeFromMetadata } from '../loom/dye';

/**
 * Screen 02 — The Weft
 *
 * The user's life as a horizontal woven band. Fetches real data from
 * the memories, letters, and voice APIs; falls back to the EmptyThread
 * warp-only view when the cloth has no picks yet.
 *
 * Four view-modes (ViewToggle in top bar):
 *   canon   — full-bleed horizontal cloth (default)
 *   pull    — one thread at a time, vertical paging (WeftPull)
 *   century — the whole archive compressed (WeftCentury)
 *   empty   — warp-only, forced (for reviewers)
 *
 * Token audit (2.1): ambientShuttle confirmed, EmptyThread on empty state
 * confirmed, zero raw hex colors, zero icon-library imports.
 */
type WeftMode = 'canon' | 'pull' | 'century' | 'empty';

const NOW_YEAR = new Date().getFullYear();

/** The author-assigned dye if it's a real palette stop, else undefined (kind default). */
const dyeOf = (metadata: any): LoomDye | undefined => dyeFromMetadata(metadata) as LoomDye | undefined;

/**
 * Fallback dye NAME per kind, so an entry the composer never dyed still weaves
 * as coloured cloth (matching the woven backdrop) rather than a grey thread.
 * Mirrors Loom's DYE_FOR_KIND but as raw palette names the cloth renderer wants.
 */
const KIND_DYE_NAME: Record<LoomKind, CanvasEntry['dye']> = {
  letter: 'walnut', photo: 'saffron', voice: 'woad', memory: 'indigo', milestone: 'saffron',
};

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
    // The list API returns camelCase `createdAt` and the user-chosen date in
    // metadata.entryDate; prefer the entry date so the thread sits on the cloth
    // where the memory actually happened, not when it was typed.
    const d = new Date(m.metadata?.entryDate || m.memory_date || m.createdAt || m.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({
      id: m.id, year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'memory',
      title: m.title?.trim() || 'a memory', date: d.toISOString(), dye: dyeOf(m.metadata),
    });
  }
  for (const l of letters) {
    // Letters and voice carry a lived entryDate too — honour it like memories.
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

/** Format an ISO date as the highlight readout date, e.g. "12 March 1995". */
function fmtFullDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function Weft() {
  const [hover, setHover] = useState<number | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [mode, setMode] = useState<WeftMode>('canon');
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setShowAI(true), 900);
    return () => clearTimeout(t);
  }, []);

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
  // Letters received from others and opened are woven into your cloth too.
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
    // Opened received letters sit on the cloth at the moment they were woven in
    // (delivered_at), attributed to the original author via recipients[0].name.
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

  const focusedEntry = hover != null ? allEntries[hover] : null;

  const entries = mode === 'empty' ? [] : allEntries;
  const wovenCount = allEntries.filter((e) => !e.locked).length;
  const sealedCount = allEntries.length - wovenCount;

  // Timeline fits the actual entries (plus a small relative pad and a sensible
  // minimum span) instead of a fixed NOW±decades window — so a handful of 2024
  // threads don't scatter across an empty 80-year cloth, and a deep archive
  // isn't cramped. The window always reaches "now" so the present is on-screen.
  const { startYear, endYear } = useMemo(() => {
    if (allEntries.length === 0) return { startYear: NOW_YEAR - 6, endYear: NOW_YEAR + 1 };
    const minYear = Math.min(allEntries[0].year, NOW_YEAR);
    const maxYear = Math.max(allEntries[allEntries.length - 1].year, NOW_YEAR);
    const pad = Math.max(1, Math.round((maxYear - minYear) * 0.1));
    let s = minYear - pad;
    let e = maxYear + pad;
    const MIN_SPAN = 8;
    if (e - s < MIN_SPAN) {
      const grow = Math.ceil((MIN_SPAN - (e - s)) / 2);
      s -= grow; e += grow;
    }
    return { startYear: s, endYear: e };
  }, [allEntries]);

  // The canon view IS the cloth now: each entry weaves as a dyed weft thread on
  // the same renderer as the woven backdrop (TapestryCanvas), not a flat CSS
  // line-pick. tStart/tEnd frame the fitted window; nowFrac marks the present.
  const tStart = useMemo(() => new Date(startYear, 0, 1), [startYear]);
  const tEnd = useMemo(() => new Date(endYear + 1, 0, 1), [endYear]);
  const canvasEntries = useMemo<CanvasEntry[]>(
    () =>
      allEntries.map((e, i) => ({
        date: e.date ? new Date(e.date) : new Date(e.year, (e.month ?? 1) - 1, 1),
        n: i + 1,
        dye: e.dye ?? KIND_DYE_NAME[e.kind],
        sealed: !!e.locked,
      })),
    [allEntries],
  );
  const nowFrac = useMemo(() => {
    const span = +tEnd - +tStart;
    return span > 0 ? Math.max(0, Math.min(1, (Date.now() - +tStart) / span)) : 1;
  }, [tStart, tEnd]);

  // Map a pointer x (fraction across the cloth) to the nearest entry, so hover
  // drives both the highlight ring and the date/topic readout — the canvas has
  // no per-thread DOM nodes, so we hit-test against each entry's time position.
  const entryFracs = useMemo(() => {
    const span = +tEnd - +tStart;
    return canvasEntries.map((e) => (span > 0 ? (+e.date - +tStart) / span : 0));
  }, [canvasEntries, tStart, tEnd]);

  const hitTest = (clientX: number, rect: DOMRect) => {
    if (rect.width <= 0 || entryFracs.length === 0) { setHover(null); return; }
    const frac = (clientX - rect.left) / rect.width;
    let best = -1;
    let bestDx = Infinity;
    for (let i = 0; i < entryFracs.length; i++) {
      const dx = Math.abs(entryFracs[i] - frac) * rect.width;
      if (dx < bestDx) { bestDx = dx; best = i; }
    }
    setHover(best >= 0 && bestDx <= 44 ? best : null);
  };

  // The cloth is the interface into the thread: a tapped pick opens its entry
  // directly in the matching room — letters → the letter room, voice → the
  // voice room, everything else (memory/photo/milestone) → the reading room.
  // The id rides as a query param so the room can land on that exact entry.
  const roomFor = (e: LoomEntry): string => {
    if (e.kind === 'letter') return e.id ? `/loom/letter?id=${e.id}` : '/loom/letter';
    if (e.kind === 'voice')  return e.id ? `/loom/voice?id=${e.id}`  : '/loom/voice';
    return e.id ? `/loom/read?entry=${e.id}` : '/loom/read';
  };
  const openAt = (clientX: number, rect: DOMRect) => {
    if (rect.width <= 0 || entryFracs.length === 0) return;
    const frac = (clientX - rect.left) / rect.width;
    let best = -1;
    let bestDx = Infinity;
    for (let i = 0; i < entryFracs.length; i++) {
      const dx = Math.abs(entryFracs[i] - frac) * rect.width;
      if (dx < bestDx) { bestDx = dx; best = i; }
    }
    if (best >= 0 && bestDx <= 44 && allEntries[best]) navigate(roomFor(allEntries[best]));
  };

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'your cloth';

  const listenerPrompt = useListener();

  const toggle = (
    <ViewToggle<WeftMode>
      value={mode}
      onChange={setMode}
      options={[
        { value: 'canon', label: 'canon' },
        { value: 'pull', label: 'pull' },
        { value: 'century', label: 'century' },
        { value: 'empty', label: 'empty' },
      ]}
    />
  );

  const memberCount = Array.isArray(threadMembersData) ? threadMembersData.length : null;
  const entryCount = (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textTransform: 'uppercase' }}>
      {allEntries.length} entries{memberCount != null ? ` · ${memberCount} members` : ''}
    </span>
  );

  // Shared right-side topbar slot: view toggle + the profile menu (settings,
  // billing, family…). The profile menu rides every authed screen.
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

  if (mode === 'pull') {
    return (
      <ClothShell
        topbarLeft={<HLogo size="sm" wordmark />}
        topbarCenter="the tapestry"
        topbarRight={rightSlot}
        backdropOpacity={0.3}
      >
        <WeftPull entries={allEntries} />
      </ClothShell>
    );
  }

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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: BOTTOM_NAV_CLEARANCE, overflow: 'hidden' }}>
        <style>{`
          .weft-padding { padding: 0 56px; }
          .weft-header-left { position: absolute; top: 28px; left: 56px; max-width: 360px; }
          .weft-header-right { position: absolute; top: 28px; right: 56px; max-width: 320px; text-align: right; }
          @media (max-width: 639px) {
            .weft-padding { padding: 0 16px; }
            .weft-header-left { left: 16px; max-width: calc(100% - 32px); }
            .weft-header-right { display: none; }
          }
        `}</style>
        <div
          className="weft-padding"
          style={{ position: 'absolute', inset: 0, top: 64, bottom: 96, cursor: focusedEntry ? 'pointer' : 'default' }}
          onMouseMove={(ev) => hitTest(ev.clientX, ev.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setHover(null)}
          onClick={(ev) => openAt(ev.clientX, ev.currentTarget.getBoundingClientRect())}
        >
          <TapestryCanvas
            height={typeof window !== 'undefined' ? Math.max(420, window.innerHeight - 320) : 480}
            entries={canvasEntries}
            noPan
            opts={{
              tStart,
              tEnd,
              nowFrac,
              activeIdx: hover,
              background: 'rgba(14,14,12,0)',
              showDecadeMarks: true,
              showFraySelvedge: true,
              showWarpHair: true,
            }}
          />
        </div>

        {/* The open region — a letter released to you surfaces here, on the cloth
            itself. Renders nothing until one waits, then takes the top as a
            priority call to open (the Unlock ceremony weaves it into the cloth). */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 25, background: 'var(--ink)' }}>
          <LettersAwaitingMe />
        </div>

        <div className="weft-header-left">
          <div className="loom-eyebrow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--warm)' }}>·</span> the weft &nbsp;·&nbsp; {displayName} &nbsp;·&nbsp; {startYear} — {endYear}
          </div>
          <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 8, letterSpacing: '0.18em' }}>
            ∞ {wovenCount} woven &nbsp;·&nbsp; {sealedCount} sealed
          </div>
        </div>

        <div className="weft-header-right">
          <div
            className="loom-eyebrow"
            style={{ marginBottom: 8, color: 'var(--bone-faint)', transition: 'opacity 360ms var(--loom-ease)', opacity: showAI ? 1 : 0 }}
          >
            the listener
          </div>
          <div
            className="loom-serif"
            style={{
              fontSize: 13,
              color: 'var(--bone-dim)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              transition: 'opacity 360ms var(--loom-ease)',
              opacity: showAI ? 1 : 0,
            }}
          >
            {listenerPrompt}
          </div>
        </div>

        <div
          className="weft-padding"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 28,
            paddingTop: 16,
            borderTop: '1px solid var(--rule)',
            transition: 'opacity 360ms var(--loom-ease)',
          }}
        >
          {focusedEntry ? (
            <div
              role="link"
              onClick={() => navigate(roomFor(focusedEntry))}
              style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'baseline', cursor: 'pointer' }}
            >
              <div className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)', whiteSpace: 'nowrap' }}>
                {fmtFullDate(focusedEntry.date) || `${focusedEntry.year}·${String(focusedEntry.month ?? 1).padStart(2, '0')}`}
              </div>
              <div className="loom-body" style={{ fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {focusedEntry.title || 'untitled'}
                {focusedEntry.recipient ? (
                  <span className="loom-dim" style={{ fontSize: 13 }}> &nbsp;·&nbsp; to {focusedEntry.recipient}</span>
                ) : null}
              </div>
              <div className="loom-eyebrow" style={{ fontSize: 10, color: 'var(--warm)', whiteSpace: 'nowrap' }}>
                {focusedEntry.locked ? 'sealed' : focusedEntry.kind} &nbsp;·&nbsp; open →
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <span
                className="loom-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}’s tapestry
              </span>
              <span className="loom-body loom-dim" style={{ fontStyle: 'italic', fontSize: 16 }}>
                {listenerPrompt}
              </span>
            </div>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
