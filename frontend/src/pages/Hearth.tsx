/**
 * The Hearth — editorial vault.
 *
 * No fire is rendered. The hearth is implied by a warm horizon at the
 * bottom of the canvas (Horizon.tsx) and by the typographic weight of
 * the page itself. Every previous attempt at depicting flames has been
 * removed.
 *
 * Layout reference: a memorial inscription, a Penguin hardcover title
 * page, the inside cover of a privately-printed family book.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Horizon } from '../components/hearth/Horizon';
import { NameRoll, type RollMember } from '../components/hearth/NameRoll';
import { SealedNote } from '../components/hearth/SealedNote';
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
import { encryptEntryBody, hasThreadKey } from '../utils/threadCrypto';

// =============================================================================
// SAMPLE DATA — used when not authenticated or no thread exists
// =============================================================================

interface SampleMember extends RollMember {
  entries: ReadableEntry[];
}

const SAMPLE_MEMBERS: SampleMember[] = [
  {
    id: 'yara',
    name: 'Yara Mahmood',
    dates: '1951 — 2027',
    state: 'warm',
    entries: [
      {
        id: 'yara-power',
        title: 'The night the power went out',
        body: `The lights went out in Karachi the spring I turned eleven, and they stayed out for four nights.

Mama lit four candles in the kitchen window. She said the fourth was for whoever was lost in the dark out there. I asked her who, and she said she didn't know, but somebody. She believed in keeping a light for somebody you didn't know.

We slept on the roof to catch the wind. I remember the smell of the candles when she blew them out at midnight, and the way the soot sat on the windowsill the next morning, and how she would not let anyone wipe it off until the power came back. As if the soot was the proof that the candles had stayed lit.

I think about it when my own kitchen goes quiet at night.`,
        authorName: 'Yara Mahmood',
        authorRelation: 'great-grandmother',
        dateLabel: '1962',
        eraLabel: 'Karachi',
      },
    ],
  },
  {
    id: 'layla',
    name: 'Layla Mahmood',
    dates: '1989 —',
    state: 'warm',
    entries: [
      {
        id: 'layla-recipe',
        title: 'On Yara\'s candles',
        body: `Mama (Yara) didn't write down recipes either. The candle thing — I was there too, I remember.

She always said it was four candles, but I remember five. There was always one extra. She would not tell me who the fifth was for. I asked her every spring until she stopped lighting them in 1993.

When she died, I found a small drawer in her desk with five small white candle stubs in it, wrapped in a piece of cotton. They were the right size to be the ones from that spring. I have them still.`,
        authorName: 'Layla Mahmood',
        authorRelation: 'aunt',
        dateLabel: '2031',
      },
    ],
  },
  {
    id: 'maya',
    name: 'Maya Mahmood',
    dates: '2037 —',
    state: 'dim',
    entries: [],
  },
];

interface SampleSealed {
  id: string;
  label: string;
  title: string;
  autoUnlockMs?: number;
  entry: ReadableEntry;
}

const SAMPLE_SEALED: SampleSealed[] = [
  {
    id: 's1',
    label: '2055 — for Maya, when she turns 18',
    title: 'For Maya, on her 18th birthday',
    autoUnlockMs: 5500,
    entry: {
      id: 's1-entry',
      title: 'For Maya, on her 18th birthday',
      body: `Maya, you don't know me. I died before you were born — at least, that's true if you're reading this on the day it was meant to open.

I want you to know one thing about your great-grandmother that nobody will tell you, because nobody else will remember.

She was extraordinarily funny. When she was young, before everything, before we left, before we lost the house — she was the funniest person I have ever met. The laughter has not survived. It does not pass down. The grief did, and the recipes did, but not the laughter.

Find a way to laugh like she did. I think it's still in you somewhere.`,
      authorName: 'Yara Mahmood',
      authorRelation: 'written 2027 · sealed for Maya',
      dateLabel: 'opens on Maya\'s 18th',
    },
  },
  {
    id: 's2',
    label: '2031 — a Christmas letter, sealed',
    title: 'A Christmas letter, sealed',
    entry: {
      id: 's2-entry',
      title: 'A Christmas letter, sealed',
      body: `(This entry has not yet opened. Its contents are encrypted under a key the platform releases when the unlock condition is met. Even we cannot read it until then.)`,
      authorName: 'Sealed',
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

interface ResolvedHearth {
  thread: Thread | null;
  members: SampleMember[];
  sealed: SampleSealed[];
  woven: WovenEntry[];
  isSample: boolean;
}

function dateLabel(iso: string, era?: number | null): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) + (era ? ` · ${era}` : '');
}

function lockUnlockLabel(lock: LockType, _date?: string | null, _age?: number | null, name?: string): string {
  if (lock === 'DATE') return 'sealed until a date';
  if (lock === 'AGE' && name) return `sealed until ${name} reaches a milestone age`;
  if (lock === 'AUTHOR_DEATH') return 'sealed until verified passing';
  if (lock === 'GENERATION') return 'sealed for a future generation';
  return 'sealed';
}

export function Hearth() {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuthStore();
  const [resolved, setResolved] = useState<ResolvedHearth | null>(null);
  const [reading, setReading] = useState<ReadableEntry | null>(null);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [unlockedSealed, setUnlockedSealed] = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);

  // ---------- Resolve hearth data ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthenticated) {
        setResolved(buildSample());
        return;
      }
      try {
        const threadsRes = await threadsApi.list();
        const thread = threadsRes.data.threads[0];
        if (!thread) {
          setResolved(buildSample());
          return;
        }
        const [membersRes, entriesRes] = await Promise.all([
          threadsApi.members(thread.id),
          threadsApi.entries(thread.id, { limit: 100 }),
        ]);
        if (cancelled) return;
        setResolved(buildLive(thread, membersRes.data.members, entriesRes.data.entries));
      } catch {
        if (!cancelled) setResolved(buildSample());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // ---------- Auto-unlock the demo bundle so first-time visitors see the moment ----------
  useEffect(() => {
    if (!resolved?.isSample) return;
    const target = SAMPLE_SEALED.find((s) => s.autoUnlockMs);
    if (!target) return;
    const t = setTimeout(() => {
      setUnlockedSealed((s) => new Set([...s, target.id]));
    }, target.autoUnlockMs);
    return () => clearTimeout(t);
  }, [resolved?.isSample]);

  // ---------- Pull a starter prompt for the sanctuary composer ----------
  useEffect(() => {
    if (!isAuthenticated) return;
    threadsApi
      .starterPrompts({ audience: 'parent' })
      .then((res) => {
        const list = res.data.prompts;
        if (list.length) setPrompt(list[Math.floor(Math.random() * list.length)].prompt_text);
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  const onAnotherPrompt = async () => {
    try {
      const res = await threadsApi.starterPrompts({ audience: 'parent' });
      const list = res.data.prompts.filter((p) => p.prompt_text !== prompt);
      if (list.length) setPrompt(list[Math.floor(Math.random() * list.length)].prompt_text);
    } catch {
      /* ignore */
    }
  };

  const onPlace = async (input: { title?: string; body: string; lock?: { kind: 'date' | 'age' | 'death'; iso?: string; ageYears?: number } }) => {
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
    const [membersRes, entriesRes] = await Promise.all([
      threadsApi.members(resolved.thread.id),
      threadsApi.entries(resolved.thread.id, { limit: 100 }),
    ]);
    setResolved(buildLive(resolved.thread, membersRes.data.members, entriesRes.data.entries));
  };

  const dimmed = reading !== null || composing;
  const data = resolved ?? buildSample();
  const familyName = useMemo(() => {
    if (data.thread?.name) return data.thread.name;
    return 'The Mahmood Hearth';
  }, [data.thread]);

  const onMember = (m: SampleMember) => {
    setActiveMemberId(m.id);
    if (m.entries.length > 0) {
      setReading(m.entries[0]);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden text-[#f4ecd8]"
      style={{ background: '#0e0e0c' }}
    >
      <Horizon intensity={dimmed ? 0.55 : 1} />

      {/* Subtle paper grain — barely perceptible, anchors the surface */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' seed=\'7\'/><feColorMatrix values=\'0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/></svg>")',
          backgroundSize: '140px 140px',
        }}
      />

      {/* Top mark — small, restrained, three columns of small caps */}
      <header className="relative z-10 px-6 sm:px-10 md:px-16 pt-7 sm:pt-10 grid grid-cols-3 items-center">
        <Link
          to="/"
          className="flex items-baseline gap-3 focus:outline-none focus-visible:underline underline-offset-4"
        >
          <span className="font-serif text-2xl text-[#b07a4a] leading-none">∞</span>
          <span className="font-sans text-[0.65rem] tracking-[0.34em] uppercase text-[rgba(244,236,216,0.55)]">
            Heirloom
          </span>
        </Link>
        <p className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-[rgba(244,236,216,0.4)] text-center">
          {familyName}
        </p>
        <div className="text-right">
          {!isAuthenticated ? (
            <Link
              to="/signup"
              className="text-[0.85rem] text-[rgba(244,236,216,0.55)] hover:text-[#f4ecd8] transition-colors duration-[180ms] focus:outline-none focus-visible:underline underline-offset-4"
            >
              open your own →
            </Link>
          ) : null}
        </div>
      </header>

      {/* Hero — title page composition */}
      <section className="relative z-10 px-6 sm:px-10 md:px-16 pt-24 sm:pt-32 md:pt-40 pb-32 sm:pb-40 max-w-[64ch] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-[0.65rem] tracking-[0.32em] uppercase text-[rgba(176,122,74,0.7)] mb-5">
            the hearth
          </p>
          <h1
            className="font-serif text-[clamp(2.75rem,6vw,4.75rem)] leading-[1.04] tracking-[-0.022em] text-[#f4ecd8]"
            style={{ fontVariationSettings: '"opsz" 72', fontWeight: 300 }}
          >
            {familyName}
          </h1>
          <p
            className="mt-7 max-w-[52ch] text-[rgba(244,236,216,0.62)] text-[1.05rem] leading-[1.7]"
            style={{ fontVariationSettings: '"opsz" 14' }}
          >
            What you write here is yours, and your family's, and the family's
            after them. Lock entries for descendants who don't exist yet. The
            thread continues after you, after us, after the company.
          </p>
        </motion.div>
      </section>

      {/* The roll — family members as type, set right of a hairline */}
      <section className="relative z-10 px-6 sm:px-10 md:px-16 max-w-[64ch] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <NameRoll
            title="who sits at the hearth"
            members={data.members.map((m) => ({
              id: m.id,
              name: m.name,
              dates: m.dates,
              state: activeMemberId === m.id ? 'lit' : m.state,
              onSelect: () => onMember(m),
            }))}
          />
        </motion.div>
      </section>

      {/* Sealed — the time-locked entries waiting to open */}
      {data.sealed.length > 0 ? (
        <section className="relative z-10 px-6 sm:px-10 md:px-16 max-w-[64ch] mx-auto mt-20 sm:mt-28">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-[0.65rem] tracking-[0.32em] uppercase text-[rgba(244,236,216,0.45)] mb-8">
              what is sealed
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-12 gap-x-10">
              {data.sealed.map((s) => (
                <SealedNote
                  key={s.id}
                  label={s.label}
                  title={s.title}
                  forceUnlock={unlockedSealed.has(s.id)}
                  onSelect={() => {
                    if (unlockedSealed.has(s.id)) setReading(s.entry);
                  }}
                />
              ))}
            </div>
          </motion.div>
        </section>
      ) : null}

      {/* Single CTA — speak by the fire */}
      <section className="relative z-10 px-6 sm:px-10 md:px-16 max-w-[64ch] mx-auto mt-24 sm:mt-32 mb-32 text-center">
        <motion.button
          type="button"
          onClick={() => {
            if (isAuthenticated && data.thread && !hasThreadKey(data.thread.id)) {
              /* thread key created on first encrypt */
            }
            setComposing(true);
          }}
          disabled={!isAuthenticated}
          initial={{ opacity: 0 }}
          animate={{ opacity: dimmed ? 0 : 1 }}
          transition={{ duration: 1.4, delay: 0.6 }}
          className="font-serif italic text-[1.15rem] sm:text-[1.25rem] text-[#b07a4a] hover:text-[#cf935a] transition-colors duration-[180ms] tracking-tight disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:underline underline-offset-[6px]"
          style={{ fontVariationSettings: '"opsz" 28' }}
        >
          {isAuthenticated ? 'place an entry on the fire →' : 'sign in to write →'}
        </motion.button>
        <p className="mt-4 font-mono text-[0.65rem] tracking-[0.18em] uppercase text-[rgba(244,236,216,0.32)]">
          {data.isSample ? 'this is an example hearth' : 'your hearth'}
        </p>
      </section>

      {/* Tapestry — set as a thin band, the artifact at hand-resting height */}
      <section className="relative z-10 px-6 sm:px-10 md:px-16 max-w-[1000px] mx-auto mt-20 sm:mt-28 mb-24">
        <Tapestry
          entries={data.woven}
          onPickEntry={(id) => {
            for (const m of data.members) {
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

      <footer className="relative z-10 px-6 sm:px-10 md:px-16 py-10 border-t border-[rgba(244,236,216,0.06)]">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-baseline gap-3">
            <span className="text-xl text-[#b07a4a]">∞</span>
            <span className="text-[0.6rem] tracking-[0.34em] uppercase text-[rgba(244,236,216,0.45)]">
              Heirloom
            </span>
          </div>
          <p className="text-[12px] text-[rgba(244,236,216,0.32)] italic font-serif text-center sm:text-right max-w-md">
            built to outlast the company that built it.
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
// DATA RESOLVERS
// =============================================================================

function buildSample(): ResolvedHearth {
  return {
    thread: null,
    members: SAMPLE_MEMBERS,
    sealed: SAMPLE_SEALED,
    woven: SAMPLE_WOVEN,
    isSample: true,
  };
}

function buildLive(thread: Thread, members: ThreadMember[], entries: ThreadEntry[]): ResolvedHearth {
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const resolvedMembers: SampleMember[] = members.map((m) => {
    const memberEntries = entries
      .filter((e) => e.author_member_id === m.id && !e.pending_lock)
      .map<ReadableEntry>((e) => ({
        id: e.id,
        title: e.title ?? undefined,
        body: '',
        authorName: m.display_name,
        authorRelation: m.relation_label ?? undefined,
        dateLabel: dateLabel(e.created_at, e.era_year),
        eraLabel: e.era_label ?? undefined,
      }));
    const hasRecent = entries.some(
      (e) => e.author_member_id === m.id && new Date(e.created_at).getTime() > sevenDaysAgo,
    );
    // birth_date isn't on the ThreadMember interface yet; when it is,
    // surface life dates here. For now leave undefined so NameRoll
    // omits the dates column.
    const dates = undefined;
    return {
      id: m.id,
      name: m.display_name,
      dates,
      state: hasRecent ? 'warm' : 'dim',
      entries: memberEntries,
    };
  });

  const sealed: SampleSealed[] = entries
    .filter((e) => e.pending_lock)
    .map((e) => {
      const author = members.find((m) => m.id === e.author_member_id);
      return {
        id: e.id,
        label: lockUnlockLabel(e.pending_lock!, null, null, author?.display_name),
        title: e.title ?? 'sealed entry',
        entry: {
          id: e.id,
          title: e.title ?? 'sealed',
          body: '(This entry has not yet opened. Its contents are encrypted under a key the platform releases when the unlock condition is met.)',
          authorName: author?.display_name ?? 'Sealed',
          dateLabel: 'sealed',
        },
      };
    });

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

  return { thread, members: resolvedMembers, sealed, woven, isSample: false };
}
