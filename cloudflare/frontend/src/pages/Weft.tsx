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
import { CosmicHeader, SectionLabel, EntryRow } from '../loom/cosmic/CosmicUI';
import { dyeVar, dyeTextVar, dyeForId } from '../loom/dye';
import { memoriesApi, lettersApi, voiceApi, threadsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeFromMetadata } from '../loom/dye';

/**
 * Screen 02 — The Weft · THE HOME (default landing).
 *
 * The home reads the family thread as TIME — "The Inheritance Horizon":
 *   · faint, unwoven FUTURE years sit ABOVE the present (ghost hairline rows
 *     labelled "not yet lived · for those not yet born") — the member's thread
 *     continuing past their own lifetime,
 *   · the PRESENT is marked "you are here" (copper only as a ≤1px stroke / text),
 *   · WOVEN years fall below, each authored row tinted by its dye.
 *
 * Beneath the Horizon: a quiet card row (Book / Wrapped / Challenges) that
 * migrated off the ∞ menu, and a single Family ("the bloodline") row.
 *
 * Real data is still fetched from the memories, letters and voice APIs and
 * woven into the Horizon; the EmptyThread warp-only view holds an empty cloth.
 *
 * Two extra view-modes survive in the ViewToggle:
 *   horizon  — the inheritance timeline (the home) [default]
 *   century  — the whole archive compressed (WeftCentury)
 *   empty    — warp-only, forced (for reviewers)
 */
type WeftMode = 'horizon' | 'century' | 'empty';

/** The author-assigned dye if it's a real palette stop, else undefined (kind default). */
const dyeOf = (metadata: any): LoomDye | undefined => dyeFromMetadata(metadata) as LoomDye | undefined;

/** Parse a date that may be a date-only `YYYY-MM-DD` string from LOCAL components
 *  (not UTC) so a same-day entry never rolls back a day in negative-offset zones. */
function parseLocal(raw: string | undefined): Date {
  if (typeof raw === 'string') {
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(raw as any);
}

/** Serialize a Date to `YYYY-MM-DD` from LOCAL components (not toISOString/UTC)
 *  so same-day entries group and round-trip without a negative-offset rollback. */
function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Compact uppercase mono date for the right-aligned row readout — "OCT 1947". */
function fmtRowDate(iso: string | undefined): string {
  if (!iso) return '';
  try {
    return parseLocal(iso).toLocaleDateString(undefined, {
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
    const d = parseLocal(m.metadata?.entryDate || m.memory_date || m.createdAt || m.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({
      id: m.id, year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'memory',
      title: m.title?.trim() || 'a memory', date: localKey(d), dye: dyeOf(m.metadata),
    });
  }
  for (const l of letters) {
    const d = parseLocal(l.metadata?.entryDate || l.createdAt || l.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({
      id: l.id, year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'letter',
      locked: !!l.sealedAt, title: l.title?.trim() || l.salutation?.trim() || 'a letter',
      date: localKey(d), recipient: recipientOf(l), dye: dyeOf(l.metadata),
    });
  }
  for (const v of voice) {
    const d = parseLocal(v.metadata?.entryDate || v.createdAt || v.created_at);
    if (isNaN(d.getTime())) continue;
    all.push({
      id: v.id, year: d.getFullYear(), month: d.getMonth() + 1, lane: lane++ % 5, kind: 'voice',
      title: v.title?.trim() || 'a voice note', date: localKey(d), dye: dyeOf(v.metadata),
    });
  }

  return all.sort((a, b) => (a.year * 12 + (a.month ?? 1)) - (b.year * 12 + (b.month ?? 1)));
}

/** The author dye for an entry — the saved dye, else a stable hash off its id. */
function dyeFor(entry: LoomEntry): LoomDye {
  return (entry.dye ?? dyeForId(entry.id ?? `${entry.year}-${entry.title ?? ''}`)) as LoomDye;
}

export function Weft() {
  const [mode, setMode] = useState<WeftMode>('horizon');
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
        { value: 'horizon', label: 'horizon' },
        { value: 'century', label: 'century' },
      ]}
    />
  );

  // The view toggle lives in the body (a right-aligned control over the
  // content), never the topbar — at 430px a 2-option toggle + UserMenu
  // overflowed the right column. The reference tapestry keeps a clean topbar
  // (wordmark + menu only); the toggle is ours.
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

  // ponytail: only members with a REAL born year feed the century math
  // (markerYears -> C_START/C_END). Synthesising now-30-10i invented dates
  // skewed the projected window; filter undated members out instead. They
  // still render elsewhere via threadMembersData (not through kinForCentury).
  const kinForCentury = (Array.isArray(threadMembersData) ? threadMembersData : [])
    .map((m: any) => ({
      name: m.name ?? m.display_name ?? 'member',
      born: m.born_year ?? m.birthYear ?? null,
      died: m.died_year ?? null,
      you: m.user_id === user?.id || m.id === user?.id,
    }))
    .filter((k): k is { name: string; born: number; died: number | null; you: boolean } => typeof k.born === 'number');

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

  // ── HORIZON MODE — the home. The thread read as TIME, present at the spine. ──

  // Gate the home on loading so the default landing shows the ProgressHair
  // hairline rather than flashing a half-built timeline on first paint —
  // mirrors the empty/loading branch above.
  if (isLoading && entries.length === 0) {
    return (
      <ClothShell
        topbarLeft={<HLogo size="sm" wordmark />}
        topbarRight={<UserMenu />}
        backdropOpacity={0.3}
      >
        <ProgressHair />
      </ClothShell>
    );
  }

  const nowYear = new Date().getFullYear();

  // Woven years (with their entries), newest-first downward into the past.
  const byYearDesc = (() => {
    const map = new Map<number, LoomEntry[]>();
    for (const e of allEntries) {
      if (!Number.isFinite(e.year)) continue;
      (map.get(e.year) ?? map.set(e.year, []).get(e.year)!).push(e);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  })();

  // Eyebrow span — "THE VANCE THREAD · 1947–2026 · 4 KIN".
  const years = allEntries.map((e) => e.year).filter((y) => Number.isFinite(y));
  const spanLo = years.length ? Math.min(...years) : null;
  const spanHi = years.length ? Math.max(...years, nowYear) : null;
  // Strip a trailing "thread" so a stored "Vance Thread" never becomes "...THREAD THREAD".
  const fam = (threadData?.name || '').trim().replace(/\s*thread$/i, '').trim();
  const label = fam ? `THE ${fam.toUpperCase()} THREAD` : 'THE THREAD';
  const eyebrow = (spanLo != null && spanHi != null
    ? `${label} · ${spanLo}–${spanHi}`
    : label) + (memberCount != null ? ` · ${memberCount} KIN` : '');

  // The unwoven future — ghost rows ABOVE the present. These are the years the
  // member's thread continues into, for hands not yet born.
  const FUTURE_OFFSETS = [90, 60, 30];

  // One-line dim subtitle: recipient for letters, else the kind.
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
          padding: '56px 24px 96px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* ── A · THE INHERITANCE HORIZON — the document H1. A Fraunces display
              title (the real, hero heading) sits under the bloodline eyebrow; the
              mono span is the eyebrow only, never a heading. ── */}
          <CosmicHeader
            align="center"
            eyebrow={eyebrow}
            title="The Inheritance Horizon"
          />

          {toggleRow}

          {/* The vertical timeline. A single faint warp runs down the left as
              the spine; future ghost rows sit at the top, the present marker
              in the middle, woven years fall below into the past. */}
          <div style={{ position: 'relative', marginTop: 6 }}>
            {/* the spine — one bone hairline, theme-aware */}
            <div
              aria-hidden
              style={{
                position: 'absolute', left: 0, top: 6, bottom: 6,
                width: 1, background: 'var(--rule-strong)',
              }}
            />

            {/* — the unwoven future (ghost / not-yet-lived) — */}
            <div style={{ paddingLeft: 22 }}>
              {FUTURE_OFFSETS.map((off, i) => (
                <FutureRow key={off} year={nowYear + off} offset={off} first={i === 0} />
              ))}
              <p
                className="hl-serif"
                style={{
                  fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
                  fontSize: 13, lineHeight: 1.5, color: 'var(--bone-faint)',
                  margin: '6px 0 0',
                }}
              >
                not yet lived · for those not yet born
              </p>
            </div>

            {/* — the present marker: "you are here" — copper only as text + a
                ≤1px stroke node on the spine. No fill, no disc, no aura. */}
            <div style={{ position: 'relative', paddingLeft: 22, margin: '26px 0 8px' }}>
              <span
                aria-hidden
                style={{
                  position: 'absolute', left: -3, top: '50%', marginTop: -3.5,
                  width: 7, height: 7,
                  border: '1px solid var(--warm)', background: 'transparent',
                  transform: 'rotate(45deg)',
                }}
              />
              <span
                className="hl-mono"
                style={{
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: 'var(--warm)',
                }}
              >
                {nowYear} · you are here
              </span>
            </div>

            {/* — the woven past, newest-first downward — each year a group, each
                row authored & dye-tinted (name/title tint = the family colour). */}
            <div style={{ paddingLeft: 22 }}>
              {byYearDesc.map(([year, group]) => (
                <div key={year} style={{ marginTop: 18 }}>
                  <div
                    className="hl-mono"
                    style={{
                      fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.28em',
                      textTransform: 'uppercase', color: 'var(--muted-4)', marginBottom: 2,
                    }}
                  >
                    {year}
                  </div>
                  {group.map((entry) => {
                    const dye = dyeFor(entry);
                    return (
                      <div
                        key={entry.id ?? `${entry.year}-${entry.month}-${entry.title}`}
                        style={{ borderLeft: `3px solid ${dyeVar(dye)}`, paddingLeft: 12, marginLeft: -22 }}
                      >
                        <div style={{ paddingLeft: 10 }}>
                          <EntryRow
                            italic={false}
                            title={
                              <>
                                {entry.locked ? (
                                  <span
                                    aria-label="sealed"
                                    title="sealed"
                                    style={{
                                      display: 'inline-block', width: 6, height: 6, marginRight: 8,
                                      border: '1px solid var(--warm)', background: 'transparent',
                                      transform: 'rotate(45deg)', verticalAlign: 'middle',
                                    }}
                                  />
                                ) : null}
                                {entry.title || 'an entry'}
                              </>
                            }
                            sub={subOf(entry)}
                            year={fmtRowDate(entry.date)}
                            titleColor={dyeTextVar(dye)}
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
              ))}
            </div>
          </div>

          {/* ───────────── B · THE CARD ROW (migrated off the ∞ menu) ───────────── */}
          <SectionLabel>Read the thread</SectionLabel>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
              gap: 14,
              marginTop: 4,
            }}
          >
            <HomeCard
              eyebrow="The Book"
              title="Bound"
              hint="Your thread, set as a printed volume."
              onClick={() => navigate('/book')}
            />
            <HomeCard
              eyebrow="Wrapped"
              title="The Year"
              hint="A year of the family, read back."
              onClick={() => navigate('/wrapped')}
            />
            <HomeCard
              eyebrow="Challenges"
              title="Prompts"
              hint="Gentle nudges to weave one more."
              onClick={() => navigate('/challenges')}
            />
          </div>

          {/* ───────────── C · THE FAMILY (the bloodline) ───────────── */}
          <SectionLabel>The bloodline</SectionLabel>
          <EntryRow
            title="Add family"
            sub={memberCount != null && memberCount > 0
              ? `${memberCount} ${memberCount === 1 ? 'hand weaves' : 'hands weave'} this thread.`
              : 'Invite the hands who will weave beside you.'}
            meta="FAMILY →"
            subFont="serif"
            subColor="var(--muted-2)"
            dateColor="var(--muted-3)"
            onClick={() => navigate('/family')}
          />
        </div>
      </div>
    </ClothShell>
  );
}

/** A single unwoven future row — a ghost hairline year, "+N yrs". No content,
 *  no dye: it is the warp waiting for a hand. */
function FutureRow({ year, offset, first }: { year: number; offset: number; first: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        padding: '9px 0',
        borderTop: first ? 'none' : '1px dashed var(--rule)',
        opacity: 0.55,
      }}
    >
      {/* a dashed ghost weft — bone hairline, never copper */}
      <span
        aria-hidden
        style={{ flex: 1, height: 1, background: 'transparent', borderTop: '1px dashed var(--bone-ghost)' }}
      />
      <span
        className="hl-mono"
        style={{
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'var(--bone-faint)', whiteSpace: 'nowrap',
        }}
      >
        {year} · +{offset} yrs
      </span>
    </div>
  );
}

/** A quiet hairline card (radius 0) — mono eyebrow, serif title, italic hint.
 *  No icon, no fill; copper appears only on the hover hairline stroke. */
function HomeCard({
  eyebrow, title, hint, onClick,
}: {
  eyebrow: string; title: string; hint: string; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        textAlign: 'left',
        padding: '16px 16px 18px',
        background: 'transparent',
        border: `1px solid ${hover ? 'var(--rule-warm)' : 'var(--rule-strong)'}`,
        borderRadius: 0,
        cursor: 'pointer',
        transition: 'border-color 180ms var(--ease)',
        width: '100%',
      }}
    >
      <span
        className="hl-mono"
        style={{
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.26em',
          textTransform: 'uppercase', color: 'var(--copper-label)',
        }}
      >
        {eyebrow}
      </span>
      <span
        className="hl-serif"
        style={{
          fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, lineHeight: 1.2,
          color: 'var(--bone)',
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
          fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted-2)',
        }}
      >
        {hint}
      </span>
    </button>
  );
}
