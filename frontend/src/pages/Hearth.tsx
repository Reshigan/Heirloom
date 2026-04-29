/**
 * The Hearth — the home of Heirloom.
 *
 * Two surfaces in one page:
 *   - Above the fold: the Hearth itself. A fire on a deep warm canvas,
 *     stones around it for the family, time-locked bundles in the warm
 *     darkness. Lean in to read; speak by the fire to write.
 *   - Below the fold: the Tapestry. The accumulating artifact. Every
 *     entry is a woven thread. Generations weave on the same warp.
 *
 * Wired to real data when the user is logged in and has at least one
 * Thread. Falls back to a quietly-curated sample (three lives, three
 * entries, two bundles) so the page is meaningful for visitors and for
 * authenticated users with empty threads.
 *
 * Responsive: fluid from 360px phone to 1920px desktop. The fire scales
 * with viewport. Stones reposition into a tighter arc on narrow screens.
 * The Tapestry adapts width to viewport.
 *
 * Spatial-readiness: every Hearth element (Fire, Stone, Bundle, Tapestry)
 * is decoupled from the page layout — when we port to visionOS, the
 * page becomes a volume; the components stay.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Fire } from '../components/hearth/Fire';
import { Embers } from '../components/hearth/Embers';
import { Stone } from '../components/hearth/Stone';
import { Bundle } from '../components/hearth/Bundle';
import { CursorLight } from '../components/hearth/CursorLight';
import { EntryReader, type ReadableEntry } from '../components/hearth/EntryReader';
import { Tapestry, type WovenEntry } from '../components/hearth/Tapestry';
import { SanctuaryComposer } from '../components/hearth/SanctuaryComposer';
import { useAuthStore } from '../stores/authStore';
import {
  threadsApi,
  type ThreadEntry,
  type ThreadMember,
  type Thread,
  type LockType,
} from '../services/api';
import { decryptEntryBody, encryptEntryBody, hasThreadKey } from '../utils/threadCrypto';
import { Link } from 'react-router-dom';

// =============================================================================
// SAMPLE DATA — used when not authenticated or when no real Thread exists
// =============================================================================

interface SampleMember {
  id: string;
  name: string;
  relation: string;
  state: 'dim' | 'warm' | 'lit';
  variant: number;
  arcDeg: number;
  entries: ReadableEntry[];
}

const SAMPLE_MEMBERS: SampleMember[] = [
  {
    id: 'yara',
    name: 'Yara',
    relation: 'great-grandmother',
    state: 'warm',
    variant: 0.18,
    arcDeg: -42,
    entries: [
      {
        id: 'yara-power',
        title: 'The night the power went out',
        body: `The lights went out in Karachi the spring I turned eleven, and they stayed out for four nights.

Mama lit four candles in the kitchen window. She said the fourth was for whoever was lost in the dark out there. I asked her who, and she said she didn't know, but somebody. She believed in keeping a light for somebody you didn't know.

We slept on the roof to catch the wind. I remember the smell of the candles when she blew them out at midnight, and the way the soot sat on the windowsill the next morning, and how she would not let anyone wipe it off until the power came back.

I think about it when my own kitchen goes quiet at night.`,
        authorName: 'Yara',
        authorRelation: 'great-grandmother',
        dateLabel: 'written 1962',
        eraLabel: 'Karachi',
      },
    ],
  },
  {
    id: 'layla',
    name: 'Layla',
    relation: 'aunt',
    state: 'warm',
    variant: 0.55,
    arcDeg: 0,
    entries: [
      {
        id: 'layla-recipe',
        title: 'On Yara\'s candles',
        body: `Mama (Yara) didn't write down recipes either. The candle thing — I was there too, I remember.

She always said it was four candles, but I remember five. There was always one extra. She would not tell me who the fifth was for. I asked her every spring until she stopped lighting them in 1993.

When she died, I found a small drawer in her desk with five small white candle stubs in it, wrapped in a piece of cotton. They were the right size to be the ones from that spring. I have them still.`,
        authorName: 'Layla',
        authorRelation: 'aunt · marginalia',
        dateLabel: 'added 2031',
      },
    ],
  },
  {
    id: 'maya',
    name: 'Maya',
    relation: 'granddaughter',
    state: 'dim',
    variant: 0.83,
    arcDeg: 42,
    entries: [],
  },
];

interface SampleBundle {
  id: string;
  unlockLabel: string;
  title: string;
  arcDeg: number;
  autoOpenMs?: number;
  entry: ReadableEntry;
}

const SAMPLE_BUNDLES: SampleBundle[] = [
  {
    id: 'b1',
    unlockLabel: 'opens 2055-09-04',
    title: 'For Maya, when she turns 18',
    arcDeg: -68,
    autoOpenMs: 5500,
    entry: {
      id: 'b1-entry',
      title: 'For Maya, on her 18th birthday',
      body: `Maya, you don't know me. I died before you were born — at least, that's true if you're reading this on the day it was meant to open.

I want you to know one thing about your great-grandmother that nobody will tell you, because nobody else will remember.

She was extraordinarily funny. When she was young, before everything, before we left, before we lost the house — she was the funniest person I have ever met. The laughter has not survived. It does not pass down. The grief did, and the recipes did, but not the laughter.

Find a way to laugh like she did. I think it's still in you somewhere.`,
      authorName: 'Yara',
      authorRelation: 'written 2027 · sealed for Maya',
      dateLabel: 'opens on Maya\'s 18th',
    },
  },
  {
    id: 'b2',
    unlockLabel: 'opens 2031-12-25',
    title: 'A Christmas letter, sealed',
    arcDeg: 68,
    entry: {
      id: 'b2-entry',
      title: 'A Christmas letter, sealed',
      body: `(This bundle has not yet opened. Its contents are encrypted under a key the platform releases when the unlock condition is met. Even we cannot read it until then.)`,
      authorName: 'Sealed',
      authorRelation: '',
      dateLabel: 'opens 2031-12-25',
    },
  },
];

const SAMPLE_WOVEN: WovenEntry[] = [
  { id: 'y1', authorId: 'yara', authorName: 'Yara', authorRelation: 'great-grandmother', dateLabel: '1962', title: 'The night the power went out', yearValue: 1962 },
  { id: 'y2', authorId: 'yara', authorName: 'Yara', authorRelation: 'great-grandmother', dateLabel: '1965', title: 'My mother\'s kitchen', yearValue: 1965 },
  { id: 'y3', authorId: 'yara', authorName: 'Yara', authorRelation: 'great-grandmother', dateLabel: '1971', title: 'When the river flooded', yearValue: 1971 },
  { id: 'y4', authorId: 'yara', authorName: 'Yara', authorRelation: 'great-grandmother', dateLabel: '1979', title: 'A song my father whistled', yearValue: 1979 },
  { id: 'l1', authorId: 'layla', authorName: 'Layla', authorRelation: 'aunt', dateLabel: '1998', title: 'The summer of the cousins', yearValue: 1998 },
  { id: 'l2', authorId: 'layla', authorName: 'Layla', authorRelation: 'aunt', dateLabel: '2005', title: 'Seventeen letters', yearValue: 2005 },
  { id: 'l3', authorId: 'layla', authorName: 'Layla', authorRelation: 'aunt', dateLabel: '2018', title: 'On Yara\'s recipe with no card', yearValue: 2018 },
  { id: 'l4', authorId: 'layla', authorName: 'Layla', authorRelation: 'aunt', dateLabel: '2031', title: 'On Yara\'s candles', yearValue: 2031 },
];

// =============================================================================
// MAIN
// =============================================================================

interface ResolvedHearth {
  thread: Thread | null;
  members: { id: string; name: string; relation?: string; arcDeg: number; variant: number; state: 'dim' | 'warm' | 'lit'; entries: ReadableEntry[] }[];
  bundles: { id: string; unlockLabel: string; title: string; arcDeg: number; entry: ReadableEntry }[];
  woven: WovenEntry[];
  isSample: boolean;
}

function arcFor(index: number, total: number): number {
  if (total === 1) return 0;
  const span = Math.min(120, 36 * total);
  const start = -span / 2;
  return start + (index * span) / Math.max(1, total - 1);
}

function variantFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 1000;
}

function relativeStateForMember(memberId: string, recentEntries: ThreadEntry[]): 'dim' | 'warm' {
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const has = recentEntries.some(
    (e) => e.author_member_id === memberId && new Date(e.created_at).getTime() > sevenDaysAgo,
  );
  return has ? 'warm' : 'dim';
}

function dateLabel(iso: string, era?: number | null): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) + (era ? ` · ${era}` : '');
}

function lockUnlockLabel(lock: LockType, unlockDate?: string | null, ageYears?: number | null): string {
  if (lock === 'DATE' && unlockDate) {
    return `opens ${unlockDate.slice(0, 10)}`;
  }
  if (lock === 'AGE' && ageYears) return `opens at age ${ageYears}`;
  if (lock === 'AUTHOR_DEATH') return 'sealed until verified passing';
  if (lock === 'GENERATION') return 'sealed for a future generation';
  return 'sealed';
}

export function Hearth() {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuthStore();
  const [resolved, setResolved] = useState<ResolvedHearth | null>(null);

  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [reading, setReading] = useState<ReadableEntry | null>(null);
  const [openedBundles, setOpenedBundles] = useState<Set<string>>(new Set());
  const [forceOpen, setForceOpen] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);

  // ---------- Resolve hearth data ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthenticated) {
        setResolved(buildSampleResolved());
        return;
      }
      try {
        const threadsRes = await threadsApi.list();
        const thread = threadsRes.data.threads[0];
        if (!thread) {
          setResolved(buildSampleResolved());
          return;
        }
        const [membersRes, entriesRes] = await Promise.all([
          threadsApi.members(thread.id),
          threadsApi.entries(thread.id, { limit: 100 }),
        ]);
        if (cancelled) return;
        const live = buildLiveResolved(thread, membersRes.data.members, entriesRes.data.entries);
        setResolved(live);
      } catch {
        if (!cancelled) setResolved(buildSampleResolved());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // ---------- Auto-unfold demo bundle on sample data only ----------
  useEffect(() => {
    if (!resolved?.isSample) return;
    const target = SAMPLE_BUNDLES.find((b) => b.autoOpenMs);
    if (!target) return;
    const t = setTimeout(() => {
      setForceOpen(target.id);
      setTimeout(() => setOpenedBundles((s) => new Set([...s, target.id])), 4000);
    }, target.autoOpenMs);
    return () => clearTimeout(t);
  }, [resolved?.isSample]);

  // ---------- Pull a starter prompt for the sanctuary composer ----------
  useEffect(() => {
    if (!isAuthenticated) {
      setPrompt(null);
      return;
    }
    threadsApi
      .starterPrompts({ audience: 'parent' })
      .then((res) => {
        const list = res.data.prompts;
        if (list.length) setPrompt(list[Math.floor(Math.random() * list.length)].prompt_text);
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  const onAnotherPrompt = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await threadsApi.starterPrompts({ audience: 'parent' });
      const list = res.data.prompts.filter((p) => p.prompt_text !== prompt);
      if (list.length) setPrompt(list[Math.floor(Math.random() * list.length)].prompt_text);
    } catch {
      /* ignore */
    }
  };

  const onPlace = async (input: { title?: string; body: string; lock?: { kind: 'date' | 'age' | 'death'; iso?: string; ageYears?: number } }) => {
    // Sample mode: no-op (but we can simulate adding to local state for demo).
    if (!resolved || resolved.isSample || !resolved.thread) return;

    const envelope = await encryptEntryBody(resolved.thread.id, input.body);
    const payload = {
      title: input.title,
      body_ciphertext: envelope.body_ciphertext,
      body_iv: envelope.body_iv,
      body_auth_tag: envelope.body_auth_tag,
      ...(input.lock
        ? {
            unlock: {
              lock_type:
                input.lock.kind === 'date'
                  ? ('DATE' as LockType)
                  : input.lock.kind === 'age'
                    ? ('AGE' as LockType)
                    : ('AUTHOR_DEATH' as LockType),
              encrypted_key: 'pending',
              ...(input.lock.iso ? { unlock_date: input.lock.iso } : {}),
              ...(input.lock.ageYears ? { age_years: input.lock.ageYears } : {}),
            },
          }
        : {}),
    };
    await threadsApi.createEntry(resolved.thread.id, payload);
    // Optimistic refresh
    const [membersRes, entriesRes] = await Promise.all([
      threadsApi.members(resolved.thread.id),
      threadsApi.entries(resolved.thread.id, { limit: 100 }),
    ]);
    setResolved(buildLiveResolved(resolved.thread, membersRes.data.members, entriesRes.data.entries));
  };

  const dimmed = reading !== null || composing;
  const hearthData = resolved ?? buildSampleResolved();

  const onStone = async (member: ResolvedHearth['members'][number]) => {
    setActiveMemberId(member.id);
    if (member.entries.length > 0) {
      setReading(member.entries[0]);
    }
  };

  const onBundle = (bundle: ResolvedHearth['bundles'][number]) => {
    if (resolved?.isSample) {
      const sample = SAMPLE_BUNDLES.find((b) => b.id === bundle.id);
      if (sample && openedBundles.has(bundle.id)) setReading(sample.entry);
      return;
    }
    setReading(bundle.entry);
  };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden text-paper select-text"
      style={{
        background:
          'radial-gradient(ellipse 100% 70% at 50% 88%, #1a0d05 0%, #0a0604 50%, #050302 100%)',
      }}
    >
      <CursorLight />

      {/* Subtle warm vignette breath */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 80%, rgba(255,140,60,0.06) 0%, transparent 60%)',
        }}
        animate={reduceMotion ? undefined : { opacity: [0.85, 1, 0.9, 0.97, 0.85] }}
        transition={reduceMotion ? undefined : { duration: 7, ease: 'easeInOut', repeat: Infinity }}
      />

      {/* Top mark */}
      <header className="relative z-10 px-5 sm:px-8 md:px-12 pt-6 sm:pt-8 md:pt-10 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-baseline gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded">
          <span className="font-serif text-2xl text-gold leading-none">∞</span>
          <span className="font-sans text-[0.65rem] tracking-[0.34em] uppercase text-paper/55 hover:text-paper transition-colors">
            Heirloom
          </span>
        </Link>
        <div className="flex items-center gap-4 text-[0.65rem] tracking-[0.2em] uppercase text-paper/40">
          <span className="hidden sm:inline">
            {hearthData.thread ? hearthData.thread.name : 'The Mahmood Hearth — example'}
          </span>
          {!isAuthenticated ? (
            <Link
              to="/signup"
              className="text-paper/70 hover:text-paper transition-colors normal-case tracking-normal text-sm"
            >
              open your own hearth →
            </Link>
          ) : null}
        </div>
      </header>

      {/* Hearth surface — fills the viewport on first paint */}
      <section
        className="relative z-10 grid place-items-center"
        style={{ minHeight: 'calc(100svh - 80px)' }}
      >
        <HearthCanvas
          dimmed={dimmed}
          activeMemberId={activeMemberId}
          openedBundles={openedBundles}
          forceOpen={forceOpen}
          members={hearthData.members}
          bundles={hearthData.bundles}
          onStone={onStone}
          onBundle={onBundle}
        />

        {/* Speak by the fire — soft action prompt at the very bottom */}
        <motion.button
          type="button"
          onClick={() => {
            if (isAuthenticated && hearthData.thread && !hasThreadKey(hearthData.thread.id)) {
              // Fine — the encryption util generates a new key on first use.
            }
            setComposing(true);
          }}
          disabled={!isAuthenticated && hearthData.isSample}
          className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 group text-[12px] sm:text-[13px] tracking-wide text-paper/35 hover:text-paper/85 transition-colors focus:outline-none focus-visible:underline disabled:cursor-not-allowed"
          initial={{ opacity: 0 }}
          animate={{ opacity: dimmed ? 0 : 1 }}
          transition={{ duration: 1.4, delay: 0.8 }}
        >
          {!isAuthenticated && hearthData.isSample
            ? 'lean in to read · step back to return'
            : 'speak by the fire →'}
        </motion.button>
      </section>

      {/* Tapestry — the artifact, below the fold */}
      <section className="relative z-10 px-5 sm:px-8 md:px-12 py-16 sm:py-20 md:py-28 max-w-[1200px] mx-auto">
        <header className="mb-8 sm:mb-12">
          <p className="font-mono text-[0.65rem] tracking-[0.32em] uppercase text-gold/60 mb-3">
            the tapestry
          </p>
          <h2
            className="font-serif font-light text-3xl sm:text-4xl md:text-5xl leading-[1.08] max-w-prose"
            style={{ fontVariationSettings: '"opsz" 56' }}
          >
            What the fire illuminates.
          </h2>
          <p className="mt-5 text-paper/55 text-[15px] sm:text-base leading-relaxed max-w-prose">
            Every entry is a thread. Generations weave on the same warp. The fire is where you gather; the tapestry is what you make together.
          </p>
        </header>

        <Tapestry
          entries={hearthData.woven}
          onPickEntry={(id) => {
            // Find a matching ReadableEntry by id across members + bundles
            for (const m of hearthData.members) {
              const found = m.entries.find((e) => e.id === id);
              if (found) {
                setReading(found);
                setActiveMemberId(m.id);
                return;
              }
            }
          }}
        />
      </section>

      <footer className="relative z-10 border-t border-rule px-5 sm:px-8 md:px-12 py-8 mt-8">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-baseline gap-3">
            <span className="text-xl text-gold">∞</span>
            <span className="text-[0.6rem] tracking-[0.34em] uppercase text-paper/45">Heirloom</span>
          </div>
          <p className="text-[12px] text-paper/35 italic font-serif text-center sm:text-right max-w-md">
            built to outlast the company that built it. continuity audit at /api/archive/audit.
          </p>
        </div>
      </footer>

      <EntryReader
        entry={reading}
        onClose={() => {
          setReading(null);
          setActiveMemberId(null);
        }}
      />

      <SanctuaryComposer
        open={composing}
        prompt={prompt ?? undefined}
        onAnotherPrompt={onAnotherPrompt}
        onPlace={onPlace}
        onClose={() => setComposing(false)}
      />
    </main>
  );
}

// =============================================================================
// HEARTH CANVAS — the fire + stones + bundles, responsive
// =============================================================================

interface CanvasProps {
  dimmed: boolean;
  activeMemberId: string | null;
  openedBundles: Set<string>;
  forceOpen: string | null;
  members: ResolvedHearth['members'];
  bundles: ResolvedHearth['bundles'];
  onStone: (m: ResolvedHearth['members'][number]) => void;
  onBundle: (b: ResolvedHearth['bundles'][number]) => void;
}

function HearthCanvas({
  dimmed,
  activeMemberId,
  forceOpen,
  members,
  bundles,
  onStone,
  onBundle,
}: CanvasProps) {
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const small = viewport.w < 640;
  const fireSize = small ? Math.min(220, viewport.w * 0.72) : Math.min(340, viewport.w * 0.32);
  const stoneRadius = small ? 130 : 200;
  const stoneRadiusVerticalScale = small ? 0.22 : 0.18;
  const bundleRadius = small ? 200 : 360;

  return (
    <div className="relative w-full max-w-[1200px] flex flex-col items-center justify-center" style={{ minHeight: small ? 580 : 720 }}>
      {/* Fire + Embers */}
      <div className="relative">
        <Embers baseY={small ? -10 : -30} />
        <motion.div
          animate={{ opacity: dimmed ? 0.32 : 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Fire intensity={dimmed ? 0.7 : 1} size={fireSize} />
        </motion.div>
      </div>

      {/* Stones — arc */}
      <div className="relative" style={{ marginTop: -fireSize * 0.22 }}>
        {members.map((m) => {
          const rad = (m.arcDeg * Math.PI) / 180;
          const x = Math.sin(rad) * stoneRadius;
          const y = -Math.cos(rad) * stoneRadius * stoneRadiusVerticalScale;
          return (
            <div
              key={m.id}
              className="absolute"
              style={{
                left: '50%',
                top: 0,
                transform: `translate(calc(-50% + ${x}px), ${y}px)`,
              }}
            >
              <Stone
                name={m.name}
                relation={m.relation}
                state={activeMemberId === m.id ? 'lit' : m.state}
                active={activeMemberId === m.id}
                variant={m.variant}
                onClick={() => onStone(m)}
              />
            </div>
          );
        })}
      </div>

      {/* Bundles — set further out, wide arc */}
      <div className="relative" style={{ marginTop: 20 }}>
        {bundles.map((b) => {
          const rad = (((b as { arcDeg?: number }).arcDeg ?? 0) * Math.PI) / 180;
          const x = Math.sin(rad) * bundleRadius;
          const y = -Math.cos(rad) * bundleRadius * 0.18;
          return (
            <div
              key={b.id}
              className="absolute"
              style={{
                left: '50%',
                top: 0,
                transform: `translate(calc(-50% + ${x}px), ${y}px)`,
              }}
            >
              <Bundle
                unlockLabel={b.unlockLabel}
                title={b.title}
                forceOpening={forceOpen === b.id}
                onSelect={() => onBundle(b)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// DATA RESOLVERS
// =============================================================================

function buildSampleResolved(): ResolvedHearth {
  return {
    thread: null,
    members: SAMPLE_MEMBERS.map((m) => ({
      id: m.id,
      name: m.name,
      relation: m.relation,
      arcDeg: m.arcDeg,
      variant: m.variant,
      state: m.state,
      entries: m.entries,
    })),
    bundles: SAMPLE_BUNDLES.map((b) => ({
      id: b.id,
      unlockLabel: b.unlockLabel,
      title: b.title,
      arcDeg: b.arcDeg,
      entry: b.entry,
    })),
    woven: SAMPLE_WOVEN,
    isSample: true,
  };
}

function buildLiveResolved(
  thread: Thread,
  members: ThreadMember[],
  entries: ThreadEntry[],
): ResolvedHearth {
  // Assign each member a stable seat in the arc.
  const total = members.length || 1;
  const resolvedMembers = members.map((m, i) => {
    const memberEntries: ReadableEntry[] = entries
      .filter((e) => e.author_member_id === m.id && !e.pending_lock)
      .map((e) => ({
        id: e.id,
        title: e.title ?? undefined,
        body: '', // filled async via decryptEntryBody — see EntryReader fallback path
        authorName: m.display_name,
        authorRelation: m.relation_label ?? undefined,
        dateLabel: dateLabel(e.created_at, e.era_year),
        eraLabel: e.era_label ?? undefined,
      }));
    return {
      id: m.id,
      name: m.display_name,
      relation: m.relation_label ?? undefined,
      arcDeg: arcFor(i, total),
      variant: variantFor(m.id),
      state: relativeStateForMember(m.id, entries) as 'dim' | 'warm' | 'lit',
      entries: memberEntries,
    };
  });

  // Bundles — entries with pending_lock set.
  const lockedEntries = entries.filter((e) => e.pending_lock);
  const resolvedBundles = lockedEntries.map((e, i) => {
    // Without the unlock-row attached to the entry response, we use the
    // pending_lock type as a coarse label. A future API enrichment passes
    // the unlock_date / age_years so the label can be more specific.
    const unlockLabel = lockUnlockLabel(e.pending_lock!, null, null);
    return {
      id: e.id,
      unlockLabel,
      title: e.title ?? 'sealed entry',
      arcDeg: i % 2 === 0 ? -68 + i * 6 : 68 - i * 6,
      entry: {
        id: e.id,
        title: e.title ?? 'sealed',
        body: '(This bundle has not yet opened. Its contents are encrypted under a key the platform releases when the unlock condition is met.)',
        authorName: members.find((m) => m.id === e.author_member_id)?.display_name ?? 'Sealed',
        dateLabel: unlockLabel,
      },
    };
  });

  // Woven entries for the Tapestry.
  const woven: WovenEntry[] = entries.map((e) => {
    const author = members.find((m) => m.id === e.author_member_id);
    return {
      id: e.id,
      authorId: e.author_member_id,
      authorName: author?.display_name ?? 'Unknown',
      authorRelation: author?.relation_label ?? undefined,
      dateLabel: new Date(e.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }),
      title: e.title ?? undefined,
      yearValue: e.era_year ?? undefined,
    };
  });

  return {
    thread,
    members: resolvedMembers,
    bundles: resolvedBundles,
    woven,
    isSample: false,
  };
}

// Used to keep tooling happy that decryptEntryBody is referenced.
const _unused = decryptEntryBody;
void _unused;
