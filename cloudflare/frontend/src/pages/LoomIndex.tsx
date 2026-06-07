import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { InfinityMenu } from '../loom/components/InfinityMenu';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { LettersAwaitingMe } from '../loom/components/LettersAwaitingMe';
import { memoriesApi, lettersApi, voiceApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeFromMetadata, dyeForId, dyeVar, moodForDye, type Dye } from '../loom/dye';

/**
 * LoomIndex — the ∞ aggregate index.
 *
 * The ∞ is the only mark in the product, and here it opens onto the whole
 * cloth at once: every memory, letter, and voice thread the author has woven,
 * regrouped on demand by TIME, RECIPIENT, or MOOD. No feed, no cards — just the
 * thread edge (dye) and the artifact, the way the rest of the loom reads.
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

function fmtDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function LoomIndex() {
  const { isAuthenticated } = useAuthStore();
  const [groupBy, setGroupBy] = useState<GroupBy>('time');

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
          recipient: firstRecipient(m), dye, mood: moodForDye(dye), href: ROOM_HREF[kind],
        });
      }

      const lets = Array.isArray((let_ as any)?.data) ? (let_ as any).data : [];
      for (const l of lets) {
        const { ord, iso, year } = parseDate(l.metadata?.entryDate || l.createdAt || l.created_at);
        const dye = dyeFromMetadata(l.metadata) ?? dyeForId(l.id);
        list.push({
          id: l.id, kind: 'letter', ord, iso, year,
          title: l.title?.trim() || l.salutation?.trim() || 'A letter',
          recipient: firstRecipient(l), dye, mood: moodForDye(dye), href: ROOM_HREF.letter,
        });
      }

      const voxs = Array.isArray((vox as any)?.data) ? (vox as any).data : [];
      for (const v of voxs) {
        const { ord, iso, year } = parseDate(v.metadata?.entryDate || v.createdAt || v.created_at);
        const dye = dyeFromMetadata(v.metadata) ?? dyeForId(v.id);
        list.push({
          id: v.id, kind: 'voice', ord, iso, year,
          title: v.title?.trim() || 'A recording',
          recipient: firstRecipient(v), dye, mood: moodForDye(dye), href: ROOM_HREF.voice,
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
          recipient: r.from || null, dye, mood: moodForDye(dye), href: ROOM_HREF.letter,
        });
      }

      list.sort((a, b) => b.ord - a.ord);
      return list;
    },
  });

  const entries: IndexEntry[] = data ?? [];

  // Group into [heading, entries] sections by the active axis.
  const sections = useMemo(() => {
    if (entries.length === 0) return [] as Array<{ key: string; items: IndexEntry[] }>;
    const map = new Map<string, IndexEntry[]>();
    const keyOf = (e: IndexEntry) =>
      groupBy === 'time' ? e.year : groupBy === 'recipient' ? e.recipient ?? 'unaddressed' : e.mood;
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

  return (
    <ClothShell topbarLeft={topbarLeft} topbarCenter={<InfinityMenu />}>
      {/* Hairline loading bar */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 1,
          background: 'var(--warm)', opacity: isLoading ? 0.6 : 0,
          transition: `opacity 360ms ${EASE}`, zIndex: 30, pointerEvents: 'none',
        }}
      />

      {/* Recipient milestone nudge — a quiet line when a letter has been released to you. */}
      <LettersAwaitingMe />

      <div style={{ padding: 'clamp(24px, 5vw, 48px)', paddingBottom: 120, maxWidth: 680 }}>
        {/* Count + axis selector */}
        <div style={{ marginBottom: 28 }}>
          <p style={{
            fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic', fontWeight: 300,
            color: 'var(--bone-dim)', margin: '0 0 14px',
          }}>
            {entries.length === 0
              ? 'The whole cloth, once you begin to weave.'
              : `${entries.length} ${entries.length === 1 ? 'thread' : 'threads'}, woven so far.`}
          </p>
          <div style={{ display: 'flex', gap: 18 }}>
            {GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupBy(g)}
                style={{
                  background: 'none', border: 0, padding: '6px 0', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: groupBy === g ? 'var(--warm)' : 'var(--bone-faint)',
                  borderBottom: groupBy === g ? '1px solid var(--warm)' : '1px solid transparent',
                }}
              >
                {g === 'time' ? 'by time' : g === 'recipient' ? 'by recipient' : 'by mood'}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        {sections.map((sec) => (
          <section key={sec.key} style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.24em',
              textTransform: 'uppercase', color: 'var(--bone-faint)',
              margin: '0 0 10px', display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{sec.key}</span>
              <span style={{ color: 'rgba(244,236,216,0.25)' }}>{sec.items.length}</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sec.items.map((e) => (
                <Link
                  key={e.id}
                  to={e.href}
                  style={{
                    borderLeft: `3px solid ${dyeVar(e.dye)}`,
                    borderBottom: '1px solid rgba(244,236,216,0.06)',
                    padding: '10px 14px', textDecoration: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', fontWeight: 300,
                    color: 'var(--bone)', lineHeight: 1.5, minWidth: 0, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {e.title}
                  </span>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'rgba(244,236,216,0.35)', flexShrink: 0,
                  }}>
                    {e.kind} · {groupBy === 'time' ? fmtDay(e.iso) : groupBy === 'recipient' ? e.mood : (e.recipient ?? e.year)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ClothShell>
  );
}

export default LoomIndex;
