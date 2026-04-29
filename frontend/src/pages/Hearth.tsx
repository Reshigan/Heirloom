/**
 * The Hearth — prototype.
 *
 * One screen. No nav. No cards. A fire on a deep warm surface, with stones
 * for the family arrayed in a low arc near the base and time-locked
 * bundles set near the embers. Lean in to read; step back to return.
 *
 * This route is intentionally NOT linked from the main navigation yet —
 * it's at /hearth for review, with three sample family members and three
 * sample entries (one open, one cross-generational, one time-locked that
 * unfolds 4s after the page loads so you can see the unlock sequence).
 */

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Fire } from '../components/hearth/Fire';
import { Embers } from '../components/hearth/Embers';
import { Stone } from '../components/hearth/Stone';
import { Bundle } from '../components/hearth/Bundle';
import { CursorLight } from '../components/hearth/CursorLight';
import { EntryReader, type ReadableEntry } from '../components/hearth/EntryReader';

interface Member {
  id: string;
  name: string;
  relation: string;
  state: 'dim' | 'warm' | 'lit';
  variant: number;
  /** Angle in degrees on the bottom arc (0=center, negative=left, positive=right). */
  arcDeg: number;
  entries: ReadableEntry[];
}

const SAMPLE_MEMBERS: Member[] = [
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

We slept on the roof to catch the wind. I remember the smell of the candles when she blew them out at midnight, and the way the soot sat on the windowsill the next morning, and how she would not let anyone wipe it off until the power came back. As if the soot was the proof that the candles had stayed lit.

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
  /** Auto-unfold after this many ms — for demo only. */
  autoOpenMs?: number;
  entry: ReadableEntry;
}

const SAMPLE_BUNDLES: SampleBundle[] = [
  {
    id: 'b1',
    unlockLabel: 'opens 2055-09-04',
    title: 'For Maya, when she turns 18',
    arcDeg: -68,
    autoOpenMs: 4000,
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

export function Hearth() {
  const reduceMotion = useReducedMotion();
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [reading, setReading] = useState<ReadableEntry | null>(null);
  const [openedBundles, setOpenedBundles] = useState<Set<string>>(new Set());
  const [forceOpen, setForceOpen] = useState<string | null>(null);

  const dimmed = reading !== null;

  // Auto-open the first sample bundle a few seconds after page load so a
  // first-time viewer sees the unfold sequence happen without action.
  useEffect(() => {
    const target = SAMPLE_BUNDLES.find((b) => b.autoOpenMs);
    if (!target) return;
    const t = setTimeout(() => {
      setForceOpen(target.id);
      setTimeout(() => {
        setOpenedBundles((s) => new Set([...s, target.id]));
      }, 4000);
    }, target.autoOpenMs);
    return () => clearTimeout(t);
  }, []);

  const onStone = (member: Member) => {
    setActiveMemberId(member.id);
    if (member.entries.length > 0) {
      setReading(member.entries[0]);
    }
  };

  const onBundle = (bundle: SampleBundle) => {
    if (openedBundles.has(bundle.id)) {
      setReading(bundle.entry);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden text-paper"
      style={{
        background:
          'radial-gradient(ellipse 100% 70% at 50% 90%, #1a0d05 0%, #0a0604 50%, #050302 100%)',
      }}
    >
      <CursorLight />

      {/* Subtle warm vignette pulse — the canvas breathes ±3% on a 7s human-breath cycle */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 80%, rgba(255,140,60,0.06) 0%, transparent 60%)',
        }}
        animate={
          reduceMotion ? undefined : { opacity: [0.85, 1, 0.9, 0.97, 0.85] }
        }
        transition={
          reduceMotion ? undefined : { duration: 7, ease: 'easeInOut', repeat: Infinity }
        }
      />

      {/* Top mark — small, restrained */}
      <header className="relative z-10 px-6 md:px-12 pt-8 md:pt-10 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-2xl text-gold">∞</span>
          <span className="font-sans text-[0.65rem] tracking-[0.34em] uppercase text-paper/55">
            Heirloom
          </span>
        </div>
        <span className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-paper/35">
          The Mahmood Hearth — prototype
        </span>
      </header>

      {/* The Hearth itself */}
      <div className="relative z-10 flex flex-col items-center justify-end h-[calc(100vh-80px)] pb-24">
        {/* Embers rise from the fire base */}
        <div className="relative">
          <Embers baseY={-30} />
          <motion.div
            animate={{ opacity: dimmed ? 0.32 : 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Fire intensity={dimmed ? 0.7 : 1} size={260} />
          </motion.div>
        </div>

        {/* Stones — arc near the fire base. Each member has a stable seat. */}
        <div className="relative mt-2">
          {SAMPLE_MEMBERS.map((m) => {
            const radius = 200;
            const rad = (m.arcDeg * Math.PI) / 180;
            const x = Math.sin(rad) * radius;
            const y = -Math.cos(rad) * radius * 0.18;
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

        {/* Bundles — set further out, in the warm darkness */}
        <div className="relative mt-2">
          {SAMPLE_BUNDLES.map((b) => {
            const radius = 380;
            const rad = (b.arcDeg * Math.PI) / 180;
            const x = Math.sin(rad) * radius;
            const y = -Math.cos(rad) * radius * 0.18;
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

        {/* Quiet caption — only the prototype, only on first view */}
        <motion.p
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[12px] tracking-wide text-paper/30 font-serif italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: dimmed ? 0 : 0.9 }}
          transition={{ duration: 1.4, delay: 0.8 }}
        >
          lean in to read · step back to return
        </motion.p>
      </div>

      <EntryReader
        entry={reading}
        onClose={() => {
          setReading(null);
          setActiveMemberId(null);
        }}
      />
    </main>
  );
}
