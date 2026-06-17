import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { InfinityMenu } from '../loom/components/InfinityMenu';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { LettersAwaitingMe } from '../loom/components/LettersAwaitingMe';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeFromMetadata, dyeForId, dyeVar, moodForDye, type Dye } from '../loom/dye';
import {
  CosmicHeader,
  EntryRow,
  SectionLabel,
  WaxSeal,
} from '../loom/cosmic/CosmicUI';

/**
 * LoomIndex — the family ledger.
 *
 * The whole cloth read as one page of the bloodline's ledger: a mono header
 * names the thread and its year-span, decade labels fall down the margin, and
 * every memory, letter, and voice thread sits as a hairline ledger row — serif
 * title, dim sub, mono date on the right, dye thread on the left. Regroupable
 * on demand by TIME, RECIPIENT, or MOOD. No feed, no cards. The arc crescent
 * over the head is the global backdrop's gesture for this surface.
 */

type Kind = 'memory' | 'photo' | 'letter' | 'voice';

interface IndexEntry {
  id: string;
  kind: Kind;
  ord: number; // epoch ms for sorting
  iso: string; // YYYY-MM-DD
  year: string;
  title: string;
  recipient: string | null;
  dye: Dye;
  mood: string;
  href: string;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const GROUPS = ['time', 'recipient', 'mood'] as const;
type GroupBy = (typeof GROUPS)[number];

const ROOM_HREF: Record<Kind, string> = {
  memory: '/loom/read',
  photo: '/loom/read',
  letter: '/loom/letter',
  voice: '/loom/voice',
};

function parseDate(iso: string | undefined): { ord: number; iso: string; year: string } {
  const d = iso ? new Date(iso) : new Date(NaN);
  const valid = !Number.isNaN(d.getTime());
  const day = (valid ? d : new Date()).toISOString().slice(0, 10);
  return { ord: valid ? d.getTime() : 0, iso: day, year: day.slice(0, 4) };
}

function firstRecipient(e: { recipients?: Array<{ name?: string }> | null }): string | null {
  const n = e.recipients?.[0]?.name?.trim();
  return n || null;
}

/** "OCT 1947" — mono right-cluster date, uppercased month + year. */
function fmtMonthYear(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase();
}

/** "1940s" — the decade bucket a year falls into. */
function decadeOf(year: string): string {
  const y = parseInt(year, 10);
  if (Number.isNaN(y)) return year;
  return `${Math.floor(y / 10) * 10}s`;
}

export function LoomIndex() {
  const { isAuthenticated, user } = useAuthStore();
  const [groupBy, setGroupBy] = useState<GroupBy>('time');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['loom-index'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const [mem, let_, vox, recv] = await Promise.all([
        memoriesApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
        lettersApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
        voiceApi.getAll({ limit: 500 }).then((r) => r.data).catch(() => null),
        lettersApi.received().then((r) => r.data).catch(() => null),
      ]);
      const list: IndexEntry[] = [];

      const mems = Array.isArray((mem as any)?.data) ? (mem as any).data : [];
      for (const m of mems) {
        const photoUrl = m.fileUrl || m.metadata?.images?.[0] || null;
        const kind: Kind = photoUrl ? 'photo' : 'memory';
        const { ord, iso, year } = parseDate(m.metadata?.entryDate || m.createdAt || m.created_at);
        const dye = dyeFromMetadata(m.metadata) ?? dyeForId(m.id);
        list.push({
          id: m.id, kind, ord, iso, year,
          title: m.title?.trim() || (photoUrl ? 'A photograph' : 'A memory'),
          recipient: firstRecipient(m), dye, mood: moodForDye(dye), href: `${ROOM_HREF[kind]}?entry=${m.id}`,
        });
      }

      const lets = Array.isArray((let_ as any)?.data) ? (let_ as any).data : [];
      for (const l of lets) {
        const { ord, iso, year } = parseDate(l.metadata?.entryDate || l.createdAt || l.created_at);
        const dye = dyeFromMetadata(l.metadata) ?? dyeForId(l.id);
        list.push({
          id: l.id, kind: 'letter', ord, iso, year,
          title: l.title?.trim() || l.salutation?.trim() || 'A letter',
          recipient: firstRecipient(l), dye, mood: moodForDye(dye), href: `${ROOM_HREF.letter}?id=${l.id}`,
        });
      }

      const voxs = Array.isArray((vox as any)?.data) ? (vox as any).data : [];
      for (const v of voxs) {
        const { ord, iso, year } = parseDate(v.metadata?.entryDate || v.createdAt || v.created_at);
        const dye = dyeFromMetadata(v.metadata) ?? dyeForId(v.id);
        list.push({
          id: v.id, kind: 'voice', ord, iso, year,
          title: v.title?.trim() || 'A recording',
          recipient: firstRecipient(v), dye, mood: moodForDye(dye), href: `${ROOM_HREF.voice}?id=${v.id}`,
        });
      }

      // Letters received from others and opened — woven into your own cloth,
      // attributed to (and dyed for) the original author.
      const recvs = Array.isArray((recv as any)?.data) ? (recv as any).data : [];
      for (const r of recvs) {
        const { ord, iso, year } = parseDate(r.deliveredAt || r.createdAt);
        const dye = dyeForId(r.id);
        list.push({
          id: r.id, kind: 'letter', ord, iso, year,
          title: r.title?.trim() || r.salutation?.trim() || `A letter from ${r.from}`,
          recipient: r.from || null, dye, mood: moodForDye(dye), href: `${ROOM_HREF.letter}?id=${r.id}`,
        });
      }

      list.sort((a, b) => b.ord - a.ord);
      return list;
    },
  });

  const entries: IndexEntry[] = data ?? [];

  // The thread is named for the bloodline — the author's family name.
  const familyName = (user?.lastName?.trim() || user?.firstName?.trim() || '').toUpperCase();

  // Year-span across the whole cloth (min–max), for the mono header.
  const yearSpan = useMemo(() => {
    const years = entries.map((e) => parseInt(e.year, 10)).filter((y) => !Number.isNaN(y));
    if (years.length === 0) return null;
    const min = Math.min(...years);
    const max = Math.max(...years);
    return min === max ? `${min}` : `${min}–${max}`;
  }, [entries]);

  // Group into [heading, entries] sections by the active axis. The time axis
  // buckets by decade so the ledger reads in eras, not single years.
  const sections = useMemo(() => {
    if (entries.length === 0) return [] as Array<{ key: string; items: IndexEntry[] }>;
    const map = new Map<string, IndexEntry[]>();
    const keyOf = (e: IndexEntry) =>
      groupBy === 'time' ? decadeOf(e.year) : groupBy === 'recipient' ? e.recipient ?? 'unaddressed' : e.mood;
    for (const e of entries) {
      const k = keyOf(e);
      (map.get(k) ?? map.set(k, []).get(k)!).push(e);
    }
    const out = Array.from(map, ([key, items]) => ({ key, items }));
    if (groupBy === 'time') out.sort((a, b) => b.key.localeCompare(a.key));
    else out.sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key));
    return out;
  }, [entries, groupBy]);

  const topbarLeft = (
    <Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'index' }]} />
  );

  // Mono header naming the thread and its span — "THE VANCE THREAD · 1947–2026".
  const headerEyebrow = (() => {
    const name = familyName ? `THE ${familyName} THREAD` : 'THE THREAD';
    return yearSpan ? `${name} · ${yearSpan}` : name;
  })();

  // A short serif sub the dye/recipient/mood axes annotate quietly.
  function entrySub(e: IndexEntry): string | undefined {
    if (groupBy === 'recipient') return e.mood;
    if (groupBy === 'mood') return e.recipient ?? undefined;
    return undefined;
  }

  // Mono right-cluster date for the time ledger; the other axes name the year.
  function entryMeta(e: IndexEntry): string {
    return groupBy === 'time' ? fmtMonthYear(e.iso) : e.year;
  }

  // Dye color for left margin thread
  function dyeColor(dye: Dye): string {
    return dyeVar(dye);
  }

  return (
    <ClothShell topbarLeft={topbarLeft} topbarCenter={<InfinityMenu />} topbarRight={<UserMenu />}>
      {/* Hairline loading bar */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 1,
          background: 'var(--warm)', opacity: isLoading ? 0.6 : 0,
          transition: `opacity 360ms ${EASE}`, zIndex: 30, pointerEvents: 'none',
        }}
      >
        {isLoading && (
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
            Loading your cloth…
          </span>
        )}
      </div>

      {/* Recipient milestone nudge — a quiet line when a letter has been released to you. */}
      <LettersAwaitingMe />

      <div style={{ padding: 'clamp(24px, 5vw, 48px)', paddingBottom: 120, maxWidth: 680, margin: '0 auto' }}>

        {/* LEDGER header — the mono thread title names the bloodline + its year-span. */}
        <CosmicHeader
          eyebrow={headerEyebrow}
          title="The Family Thread"
          sub={
            entries.length === 0
              ? 'The whole cloth, once you begin to weave.'
              : undefined
          }
        />

        {/* Grouping axis selector — quiet mono control, the decade ledger dominates. */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              style={{
                background: 'none', border: 0, padding: '10px 0', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: groupBy === g ? 'var(--copper-label)' : 'var(--muted-2)',
                borderBottom: groupBy === g ? '1px solid var(--copper-border)' : '1px solid transparent',
                transition: `color 180ms ${EASE}, border-color 180ms ${EASE}`,
                minHeight: 44,
              }}
            >
              {g === 'time' ? 'by time' : g === 'recipient' ? 'by recipient' : 'by mood'}
            </button>
          ))}
        </div>

        {/* Quick links — feature destinations, kept as quiet mono text links */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap', borderBottom: '1px solid var(--rule)', paddingBottom: 18 }}>
          {([
            { label: 'wrapped', to: '/wrapped' },
            { label: 'book', to: '/book-builder' },
            { label: 'challenges', to: '/challenges' },
            { label: 'milestones', to: '/milestones' },
          ] as const).map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.3em',
                textTransform: 'uppercase', color: 'var(--muted-2)',
                textDecoration: 'none',
                minHeight: 44, display: 'inline-flex', alignItems: 'center',
              }}
            >
              {label} →
            </Link>
          ))}
        </div>

        {/* LEDGER — decade sections, each a SectionLabel above its EntryRow list */}
        {sections.map((sec) => (
          <section key={sec.key} aria-label={sec.key}>
            <SectionLabel>{sec.key}</SectionLabel>

            <div>
              {sec.items.map((e) => (
                <div
                  key={e.id}
                  style={{ borderLeft: `3px solid ${dyeColor(e.dye)}`, paddingLeft: 18 }}
                >
                  {/* dye omitted intentionally: the wrapper div paints the left
                      thread, and passing dye here would trigger EntryRow's
                      year/dot/author ledger branch and suppress the month-year meta. */}
                  <EntryRow
                    title={e.title}
                    sub={entrySub(e)}
                    italic
                    meta={entryMeta(e)}
                    onClick={() => navigate(e.href)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Empty state — centered serif-italic dim line */}
        {!isLoading && entries.length === 0 && (
          <p style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
            fontSize: 17, color: 'var(--bone-dim)', textAlign: 'center',
            marginTop: 80, lineHeight: 1.7,
          }}>
            Begin weaving. Each memory, letter, and voice<br />thread will appear here.
          </p>
        )}

        {/* WaxSeal foot — the ∞ rests at the page's end */}
        <div style={{ marginTop: 72 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </ClothShell>
  );
}

export default LoomIndex;
