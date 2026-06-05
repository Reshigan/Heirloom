import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../components/ClothShell';
import { HLogo } from '../components/HLogo';
import { Loom, type LoomEntry, type LoomLigature } from '../components/Loom';
import { ViewToggle } from '../components/ViewToggle';
import { EmptyThread } from '../components/EmptyThread';
import { WeftPull } from '../components/WeftPull';
import { WeftCentury } from '../components/WeftCentury';
import { memoriesApi, lettersApi, voiceApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useListener } from '../../hooks/useListener';

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

function toEntries(
  memories: any[],
  letters: any[],
  voice: any[],
): LoomEntry[] {
  const all: LoomEntry[] = [];
  let lane = 0;

  for (const m of memories) {
    const d = new Date(m.memory_date || m.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({ year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'memory', title: m.title ?? undefined });
  }
  for (const l of letters) {
    const d = new Date(l.createdAt || l.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({ year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'letter', locked: !!l.sealedAt, title: l.title ?? l.salutation ?? undefined });
  }
  for (const v of voice) {
    const d = new Date(v.createdAt || v.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({ year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'voice', title: v.title ?? undefined });
  }

  return all.sort((a, b) => (a.year * 12 + (a.month ?? 1)) - (b.year * 12 + (b.month ?? 1)));
}

export function Weft() {
  const [hover, setHover] = useState<number | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [mode, setMode] = useState<WeftMode>('canon');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setShowAI(true), 900);
    return () => clearTimeout(t);
  }, []);

  const { data: memoriesData } = useQuery({
    queryKey: ['weft-memories'],
    queryFn: () => memoriesApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
  });
  const { data: lettersData } = useQuery({
    queryKey: ['weft-letters'],
    queryFn: () => lettersApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
  });
  const { data: voiceData } = useQuery({
    queryKey: ['weft-voice'],
    queryFn: () => voiceApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
  });

  const allEntries = useMemo(() => {
    const mems = Array.isArray((memoriesData as any)?.data) ? (memoriesData as any).data : [];
    const lets = Array.isArray((lettersData as any)?.data) ? (lettersData as any).data : [];
    const vox = Array.isArray((voiceData as any)?.data) ? (voiceData as any).data : [];
    return toEntries(mems, lets, vox);
  }, [memoriesData, lettersData, voiceData]);

  const ligatures: LoomLigature[] = [];

  const focusedEntry = hover != null ? allEntries[hover] : null;

  const entries = mode === 'empty' ? [] : allEntries;
  const wovenCount = allEntries.filter((e) => !e.locked).length;
  const sealedCount = allEntries.length - wovenCount;

  const startYear = allEntries.length > 0
    ? Math.min(allEntries[0].year - 5, NOW_YEAR - 30)
    : NOW_YEAR - 30;
  const endYear = allEntries.length > 0
    ? Math.max(allEntries[allEntries.length - 1].year + 30, NOW_YEAR + 50)
    : NOW_YEAR + 50;

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

  const entryCount = (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'rgba(244,236,216,0.38)', textTransform: 'uppercase' }}>
      {wovenCount} woven
    </span>
  );

  if (mode === 'empty' || entries.length === 0) {
    return (
      <ClothShell
        topbarLeft={<HLogo size="sm" wordmark />}
        topbarCenter="the tapestry"
        topbarRight={toggle}
        backdropOpacity={0.3}
      >
        <EmptyThread onWeave={() => navigate('/compose')} onRecord={() => navigate('/record')} />
      </ClothShell>
    );
  }

  if (mode === 'pull') {
    return (
      <ClothShell
        topbarLeft={<HLogo size="sm" wordmark />}
        topbarCenter="the tapestry"
        topbarRight={toggle}
        backdropOpacity={0.3}
      >
        <WeftPull />
      </ClothShell>
    );
  }

  if (mode === 'century') {
    return (
      <ClothShell
        topbarLeft={<HLogo size="sm" wordmark />}
        topbarCenter="the tapestry"
        topbarRight={toggle}
        backdropOpacity={0.3}
      >
        <WeftCentury />
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
        </div>
      }
      backdropOpacity={0.3}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
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
        <div className="weft-padding" style={{ position: 'absolute', inset: 0, top: 64, bottom: 96 }}>
          <Loom
            entries={entries}
            ligatures={ligatures}
            startYear={startYear}
            endYear={endYear}
            highlight={hover}
            onHover={setHover}
            height={typeof window !== 'undefined' ? Math.max(420, window.innerHeight - 320) : 480}
            nowYear={NOW_YEAR}
            appendCount={wovenCount}
            ambientShuttle
          />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'baseline' }}>
              <div className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)' }}>
                {focusedEntry.year}·{String(focusedEntry.month ?? 1).padStart(2, '0')}
              </div>
              <div className="loom-body" style={{ fontSize: 18 }}>
                {focusedEntry.title}
              </div>
              <div className="loom-eyebrow" style={{ fontSize: 10 }}>
                {focusedEntry.locked ? 'sealed' : focusedEntry.kind}
              </div>
            </div>
          ) : (
            <div className="loom-body loom-dim" style={{ fontStyle: 'italic', fontSize: 16 }}>
              {listenerPrompt}
            </div>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
