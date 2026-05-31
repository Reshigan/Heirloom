import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wrappedApi } from '../services/api';

// Royalty-free ambient music URL - using SoundJay's free sounds (no hotlink protection)
// This is a gentle rain ambience suitable for the Wrapped experience
const THEME_MUSIC_URL = 'https://www.soundjay.com/nature/sounds/rain-01.mp3';

// Types for wrapped data
interface WrappedStats {
  totalMemories: number;
  totalVoiceStories: number;
  totalLetters: number;
  totalMinutesRecorded: number;
  familyMembersConnected: number;
  memoriesShared: number;
  topEmotions: EmotionData[];
  monthlyActivity: MonthlyData[];
  mostActiveDay: string;
  longestStreak: number;
  milestones: Milestone[];
  topRecipients: Recipient[];
  wordCloud: WordCloudItem[];
  yearHighlights: Highlight[];
}

interface EmotionData {
  emotion: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

interface MonthlyData {
  month: string;
  memories: number;
  voices: number;
  letters: number;
}

interface Milestone {
  date: string;
  title: string;
  description: string;
  type: 'memory' | 'voice' | 'letter' | 'family' | 'streak';
}

interface Recipient {
  name: string;
  relationship: string;
  itemsShared: number;
  avatar?: string;
}

interface WordCloudItem {
  word: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface Highlight {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  date: string;
  emotion: string;
  preview?: string;
}

// Default stats when API data is loading or unavailable
const getDefaultStats = (): WrappedStats => ({
  totalMemories: 0,
  totalVoiceStories: 0,
  totalLetters: 0,
  totalMinutesRecorded: 0,
  familyMembersConnected: 0,
  memoriesShared: 0,
  topEmotions: [],
  monthlyActivity: [
    { month: 'Jan', memories: 0, voices: 0, letters: 0 },
    { month: 'Feb', memories: 0, voices: 0, letters: 0 },
    { month: 'Mar', memories: 0, voices: 0, letters: 0 },
    { month: 'Apr', memories: 0, voices: 0, letters: 0 },
    { month: 'May', memories: 0, voices: 0, letters: 0 },
    { month: 'Jun', memories: 0, voices: 0, letters: 0 },
    { month: 'Jul', memories: 0, voices: 0, letters: 0 },
    { month: 'Aug', memories: 0, voices: 0, letters: 0 },
    { month: 'Sep', memories: 0, voices: 0, letters: 0 },
    { month: 'Oct', memories: 0, voices: 0, letters: 0 },
    { month: 'Nov', memories: 0, voices: 0, letters: 0 },
    { month: 'Dec', memories: 0, voices: 0, letters: 0 },
  ],
  mostActiveDay: 'Sunday',
  longestStreak: 0,
  milestones: [],
  topRecipients: [],
  wordCloud: [],
  yearHighlights: [],
});

// Transform API response to WrappedStats format
const transformApiResponse = (data: Record<string, unknown>): WrappedStats => ({
  totalMemories: (data.totalMemories as number) || 0,
  totalVoiceStories: (data.totalVoiceStories as number) || 0,
  totalLetters: (data.totalLetters as number) || 0,
  totalMinutesRecorded: (data.totalMinutesRecorded as number) || 0,
  familyMembersConnected: (data.familyMembersConnected as number) || 0,
  memoriesShared: (data.memoriesShared as number) || 0,
  topEmotions: (data.topEmotions as EmotionData[]) || [],
  monthlyActivity: (data.monthlyActivity as MonthlyData[]) || getDefaultStats().monthlyActivity,
  mostActiveDay: (data.mostActiveDay as string) || 'Sunday',
  longestStreak: (data.longestStreak as number) || 0,
  milestones: (data.milestones as Milestone[]) || [],
  topRecipients: (data.topRecipients as Recipient[]) || [],
  wordCloud: (data.wordCloud as WordCloudItem[]) || [],
  yearHighlights: (data.yearHighlights as Highlight[]) || [],
});

/* ─── CSS-transition entrance hook ─────────────────────────────────
   Returns `mounted` — flips true on next tick so the first paint
   is at opacity 0 / transform offset, triggering the CSS transition.
   The `key` from the slide ensures each slide remounts.            */
function useEntrance() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

/* ─── Entrance style helpers ────────────────────────────────────── */
const EASE = 'cubic-bezier(0.16,1,0.3,1)';

function fadeRise(
  mounted: boolean,
  opts?: { delay?: number; dur?: number; y?: number }
): React.CSSProperties {
  const delay = opts?.delay ?? 0;
  const dur   = opts?.dur   ?? 360;
  const y     = opts?.y     ?? 0;
  return {
    opacity:   mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : `translateY(${y}px)`,
    transition: `opacity ${dur}ms ${EASE} ${delay}ms, transform ${dur}ms ${EASE} ${delay}ms`,
  };
}

function fadeScale(
  mounted: boolean,
  opts?: { delay?: number; dur?: number; from?: number }
): React.CSSProperties {
  const delay = opts?.delay ?? 0;
  const dur   = opts?.dur   ?? 720;
  const from  = opts?.from  ?? 0.8;
  return {
    opacity:   mounted ? 1 : 0,
    transform: mounted ? 'scale(1)' : `scale(${from})`,
    transition: `opacity ${dur}ms ${EASE} ${delay}ms, transform ${dur}ms ${EASE} ${delay}ms`,
  };
}

/* ─── Shared slide wrapper ──────────────────────────────────────── */
const SlideWrap: React.FC<{ children: React.ReactNode; mounted: boolean }> = ({ children, mounted }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
      padding: '0 48px',
      ...fadeRise(mounted, { dur: 360 }),
    }}
  >
    {children}
  </div>
);

/* ─── Big number display ─────────────────────────────────────────── */
const BigNum: React.FC<{ n: number | string; mounted: boolean; delay?: number }> = ({
  n,
  mounted,
  delay = 300,
}) => (
  <div
    style={{
      fontFamily: "'Source Serif 4', Georgia, serif",
      fontVariationSettings: "'opsz' 72",
      fontWeight: 200,
      fontSize: 'clamp(80px, 16vw, 160px)',
      lineHeight: 0.92,
      letterSpacing: '-0.024em',
      color: 'var(--loom-bone)',
      ...fadeRise(mounted, { delay, dur: 720, y: 24 }),
    }}
  >
    {n}
  </div>
);

/* ─── Slide: Intro ───────────────────────────────────────────────── */
const IntroSlide: React.FC<{ year: number }> = ({ year }) => {
  const mounted = useEntrance();
  return (
    <SlideWrap mounted={mounted}>
      <div style={{
        color: 'var(--loom-warm)',
        fontSize: 64,
        lineHeight: 1,
        marginBottom: 48,
        fontFamily: "'Source Serif 4', serif",
        ...fadeScale(mounted, { dur: 1400 }),
      }}>
        ∞
      </div>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 20,
        ...fadeRise(mounted, { delay: 300, dur: 720, y: 16 }),
      }}>
        Heirloom Wrapped
      </p>
      <h1 style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontVariationSettings: "'opsz' 56",
        fontWeight: 300,
        fontStyle: 'italic',
        fontSize: 'clamp(40px, 8vw, 80px)',
        lineHeight: 1.04,
        letterSpacing: '-0.014em',
        color: 'var(--loom-bone)',
        margin: 0,
        ...fadeRise(mounted, { delay: 500, dur: 720, y: 20 }),
      }}>
        Your {year}.
      </h1>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginTop: 48,
        ...fadeRise(mounted, { delay: 1000, dur: 720 }),
      }}>
        Tap to continue
      </p>
    </SlideWrap>
  );
};

/* ─── Slide: Total Memories ──────────────────────────────────────── */
const TotalMemoriesSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  const mounted = useEntrance();
  return (
    <SlideWrap mounted={mounted}>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 24,
        ...fadeRise(mounted, { dur: 360, y: -16 }),
      }}>
        This year, you preserved
      </p>
      <BigNum n={stats.totalMemories} mounted={mounted} />
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontVariationSettings: "'opsz' 28",
        fontWeight: 300,
        fontStyle: 'italic',
        fontSize: 'clamp(22px, 4vw, 36px)',
        color: 'var(--loom-bone-dim)',
        marginTop: 16,
        ...fadeRise(mounted, { delay: 500, dur: 720, y: 16 }),
      }}>
        memories.
      </p>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: 'var(--loom-bone-faint)',
        marginTop: 32,
        ...fadeRise(mounted, { delay: 800, dur: 720 }),
      }}>
        {Math.round(stats.totalMemories / 12)} per month on average
      </p>
    </SlideWrap>
  );
};

/* ─── Waveform bars — CSS keyframe animation ─────────────────────── */
const waveformStyle = `
@keyframes loom-waveform {
  0%, 100% { height: 8px; }
  50%       { height: var(--wh); }
}
`;

const VoiceStoriesSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  const mounted = useEntrance();
  return (
    <SlideWrap mounted={mounted}>
      <style>{waveformStyle}</style>
      {/* Waveform — hairline bars, CSS-animated */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        height: 64,
        marginBottom: 40,
        ...fadeRise(mounted, { dur: 720 }),
      }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 1,
              background: 'var(--loom-warm)',
              borderRadius: 0,
              height: 8,
              '--wh': `${16 + (i % 5) * 10}px`,
              animation: mounted
                ? `loom-waveform ${1.2 + (i % 4) * 0.18}s ${EASE} ${i * 0.04}s infinite`
                : 'none',
            } as React.CSSProperties}
          />
        ))}
      </div>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 20,
        ...fadeRise(mounted, { delay: 200, dur: 360, y: -16 }),
      }}>
        Your voice echoed through
      </p>
      <BigNum n={stats.totalVoiceStories} mounted={mounted} delay={400} />
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontVariationSettings: "'opsz' 28",
        fontWeight: 300,
        fontStyle: 'italic',
        fontSize: 'clamp(22px, 4vw, 36px)',
        color: 'var(--loom-bone-dim)',
        marginTop: 16,
        ...fadeRise(mounted, { delay: 600, dur: 720, y: 16 }),
      }}>
        voice stories.
      </p>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: 'var(--loom-bone-faint)',
        marginTop: 32,
        ...fadeRise(mounted, { delay: 900, dur: 720 }),
      }}>
        {stats.totalMinutesRecorded} minutes preserved
      </p>
    </SlideWrap>
  );
};

/* ─── Slide: Emotions ────────────────────────────────────────────── */

/** Thin warm bar that grows to its target width via CSS transition. */
const EmotionBar: React.FC<{ percentage: number; mounted: boolean; delay: number }> = ({
  percentage,
  mounted,
  delay,
}) => (
  <div style={{ height: 1, background: 'var(--loom-rule)', overflow: 'hidden', position: 'relative' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--loom-warm)',
        width: mounted ? `${percentage}%` : '0%',
        transition: `width 720ms ${EASE} ${delay}ms`,
      }}
    />
  </div>
);

const EmotionsSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  const mounted = useEntrance();
  const topEmotions = stats.topEmotions || [];
  return (
    <SlideWrap mounted={mounted}>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 40,
        ...fadeRise(mounted, { dur: 360, y: -16 }),
      }}>
        The emotions that colored your year
      </p>
      {topEmotions.length === 0 ? (
        <p style={{ fontFamily: "'Source Serif 4', serif", fontStyle: 'italic', color: 'var(--loom-bone-dim)', fontSize: 18 }}>
          Start weaving memories to see your emotional thread.
        </p>
      ) : (
        <div style={{ width: '100%', maxWidth: 400 }}>
          {topEmotions.map((emotion, index) => (
            <div
              key={emotion.emotion}
              style={{
                marginBottom: 20,
                ...fadeRise(mounted, { delay: index * 120, dur: 720, y: 0 }),
                /* x-axis entrance via opacity only — simpler without x transform on rows */
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateX(0)' : 'translateX(-24px)',
                transition: `opacity 720ms ${EASE} ${index * 120}ms, transform 720ms ${EASE} ${index * 120}ms`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: "'Source Serif 4', serif", fontVariationSettings: "'opsz' 14", fontWeight: 400, fontSize: 16, color: 'var(--loom-bone)' }}>
                  {emotion.emotion}
                </span>
                <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                  {emotion.percentage}%
                </span>
              </div>
              <EmotionBar
                percentage={emotion.percentage}
                mounted={mounted}
                delay={500 + index * 120}
              />
            </div>
          ))}
        </div>
      )}
      {topEmotions.length > 0 && (
        <p style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontVariationSettings: "'opsz' 28",
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: 18,
          color: 'var(--loom-warm)',
          marginTop: 28,
          ...fadeRise(mounted, { delay: 1200, dur: 720 }),
        }}>
          {topEmotions[0].emotion} ran through your weft.
        </p>
      )}
    </SlideWrap>
  );
};

/* ─── Slide: Family constellation ────────────────────────────────── */
const FamilySlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  const mounted = useEntrance();
  return (
    <SlideWrap mounted={mounted}>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 32,
        ...fadeRise(mounted, { dur: 360, y: -16 }),
      }}>
        Your constellation grew to
      </p>

      {/* Constellation — hairline SVG, no icon lib */}
      <div style={{
        position: 'relative',
        width: 220,
        height: 220,
        marginBottom: 32,
        ...fadeScale(mounted, { delay: 300, dur: 720 }),
      }}>
        {/* Center — ∞ mark */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 48, height: 48,
          border: '1px solid var(--loom-warm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Source Serif 4', serif",
          fontSize: 20, color: 'var(--loom-warm)',
        }}>
          ∞
        </div>

        {/* Connection hairlines — plain SVG */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          {stats.topRecipients.map((_, i) => {
            const angle = (i * 360) / Math.max(stats.topRecipients.length, 1);
            const x = Math.cos((angle * Math.PI) / 180) * 80 + 110;
            const y = Math.sin((angle * Math.PI) / 180) * 80 + 110;
            return (
              <line
                key={i}
                x1="110" y1="110" x2={x} y2={y}
                stroke="var(--loom-rule)"
                strokeWidth="1"
                style={{
                  opacity: mounted ? 1 : 0,
                  transition: `opacity 720ms ${EASE} ${300 + i * 100}ms`,
                }}
              />
            );
          })}
        </svg>

        {/* Family nodes */}
        {stats.topRecipients.map((recipient, i) => {
          const angle = (i * 360) / Math.max(stats.topRecipients.length, 1);
          const x = Math.cos((angle * Math.PI) / 180) * 80;
          const y = Math.sin((angle * Math.PI) / 180) * 80;
          return (
            <div
              key={recipient.name}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px - 20px)`,
                top: `calc(50% + ${y}px - 20px)`,
                width: 40, height: 40,
                border: '1px solid var(--loom-rule)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: 'var(--loom-bone-dim)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'scale(1)' : 'scale(0)',
                transition: `opacity 720ms ${EASE} ${500 + i * 150}ms, transform 720ms ${EASE} ${500 + i * 150}ms`,
              }}
            >
              {recipient.name.slice(0, 3)}
            </div>
          );
        })}
      </div>

      <BigNum n={stats.familyMembersConnected} mounted={mounted} delay={1000} />
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontVariationSettings: "'opsz' 28",
        fontWeight: 300,
        fontStyle: 'italic',
        fontSize: 'clamp(18px, 3vw, 28px)',
        color: 'var(--loom-bone-dim)',
        marginTop: 12,
        ...fadeRise(mounted, { delay: 1200, dur: 720 }),
      }}>
        threads in your cloth.
      </p>
    </SlideWrap>
  );
};

/* ─── Slide: Streak ──────────────────────────────────────────────── */
const StreakSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  const mounted = useEntrance();
  return (
    <SlideWrap mounted={mounted}>
      <div style={{
        fontFamily: "'Source Serif 4', serif",
        fontSize: 56,
        color: 'var(--loom-bone-faint)',
        marginBottom: 32,
        lineHeight: 1,
        ...fadeScale(mounted, { dur: 1400 }),
      }}>
        ∞
      </div>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 20,
        ...fadeRise(mounted, { delay: 300, dur: 360, y: 16 }),
      }}>
        Your longest streak was
      </p>
      <BigNum n={stats.longestStreak} mounted={mounted} delay={500} />
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontVariationSettings: "'opsz' 28",
        fontWeight: 300,
        fontStyle: 'italic',
        fontSize: 'clamp(22px, 4vw, 36px)',
        color: 'var(--loom-bone-dim)',
        marginTop: 12,
        ...fadeRise(mounted, { delay: 700, dur: 720, y: 16 }),
      }}>
        days.
      </p>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: 'var(--loom-bone-faint)',
        marginTop: 28,
        ...fadeRise(mounted, { delay: 1000, dur: 720 }),
      }}>
        Most active on {stats.mostActiveDay}s
      </p>
    </SlideWrap>
  );
};

/* ─── Slide: Word Cloud ──────────────────────────────────────────── */
const WordCloudSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  const mounted = useEntrance();
  return (
    <SlideWrap mounted={mounted}>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 40,
        ...fadeRise(mounted, { dur: 360, y: -16 }),
      }}>
        Words that defined your year
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 480 }}>
        {stats.wordCloud.map((item, index) => (
          <span
            key={item.word}
            style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontVariationSettings: "'opsz' 28",
              fontWeight: item.sentiment === 'positive' ? 300 : 400,
              fontStyle: item.sentiment === 'positive' ? 'italic' : 'normal',
              fontSize: Math.max(13, Math.min(item.count / 2, 36)),
              color: item.sentiment === 'positive' ? 'var(--loom-bone)' : 'var(--loom-bone-dim)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'scale(1)' : 'scale(0.7)',
              transition: `opacity 360ms ${EASE} ${index * 70}ms, transform 360ms ${EASE} ${index * 70}ms`,
            }}
          >
            {item.word}
          </span>
        ))}
      </div>
    </SlideWrap>
  );
};

/* ─── Slide: Letters ─────────────────────────────────────────────── */
const LettersSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  const mounted = useEntrance();
  return (
    <SlideWrap mounted={mounted}>
      {/* Envelope — typographic, hairline only */}
      <div style={{
        width: 160, height: 104,
        border: '1px solid var(--loom-rule)',
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 40,
        ...fadeRise(mounted, { delay: 200, dur: 720, y: -32 }),
      }}>
        <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: 'var(--loom-bone-faint)' }}>∞</span>
        {/* Envelope V-fold — purely decorative, 2 hairline SVG lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <line x1="0" y1="0" x2="80" y2="52" stroke="var(--loom-rule)" strokeWidth="1" />
          <line x1="160" y1="0" x2="80" y2="52" stroke="var(--loom-rule)" strokeWidth="1" />
        </svg>
      </div>

      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 20,
        ...fadeRise(mounted, { delay: 300, dur: 360, y: 16 }),
      }}>
        You wrote
      </p>
      <BigNum n={stats.totalLetters} mounted={mounted} delay={500} />
      <p style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontVariationSettings: "'opsz' 28",
        fontWeight: 300,
        fontStyle: 'italic',
        fontSize: 'clamp(22px, 4vw, 36px)',
        color: 'var(--loom-bone-dim)',
        marginTop: 12,
        ...fadeRise(mounted, { delay: 700, dur: 720, y: 16 }),
      }}>
        letters.
      </p>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: 'var(--loom-bone-faint)',
        marginTop: 28,
        ...fadeRise(mounted, { delay: 1000, dur: 720 }),
      }}>
        Messages waiting to be discovered.
      </p>
    </SlideWrap>
  );
};

/* ─── Slide: Summary ─────────────────────────────────────────────── */
const SummarySlide: React.FC<{ stats: WrappedStats; year: number }> = ({ stats, year }) => {
  const mounted = useEntrance();
  return (
    <SlideWrap mounted={mounted}>
      <div style={{
        fontFamily: "'Source Serif 4', serif",
        fontSize: 48,
        color: 'var(--loom-warm)',
        marginBottom: 28,
        lineHeight: 1,
        ...fadeScale(mounted, { dur: 1400, from: 0.7 }),
      }}>
        ∞
      </div>
      <h2 style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontVariationSettings: "'opsz' 56",
        fontWeight: 300,
        fontStyle: 'italic',
        fontSize: 'clamp(28px, 5vw, 52px)',
        lineHeight: 1.04,
        letterSpacing: '-0.014em',
        color: 'var(--loom-bone)',
        margin: '0 0 40px',
        ...fadeRise(mounted, { delay: 300, dur: 720, y: 20 }),
      }}>
        Your {year} tapestry.
      </h2>

      {/* 2×2 stat grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        marginBottom: 36,
        width: '100%',
        maxWidth: 320,
        ...fadeRise(mounted, { delay: 500, dur: 720, y: 24 }),
      }}>
        {([
          [stats.totalMemories, 'Memories'],
          [stats.totalVoiceStories, 'Voice Stories'],
          [stats.totalLetters, 'Letters'],
          [stats.familyMembersConnected, 'Family'],
        ] as [number, string][]).map(([val, label]) => (
          <div key={label} style={{ border: '1px solid var(--loom-rule)', padding: '20px 16px', textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontVariationSettings: "'opsz' 56",
              fontWeight: 200,
              fontSize: 'clamp(28px, 6vw, 48px)',
              lineHeight: 1,
              letterSpacing: '-0.024em',
              color: 'var(--loom-bone)',
              marginBottom: 6,
            }}>{val}</div>
            <div className="loom-eyebrow" style={{ fontSize: 9 }}>{label}</div>
          </div>
        ))}
      </div>

      {stats.topEmotions && stats.topEmotions.length > 0 && (
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--loom-bone-faint)',
          marginBottom: 32,
          ...fadeRise(mounted, { delay: 800, dur: 720 }),
        }}>
          Dominant emotion — <span style={{ color: 'var(--loom-bone-dim)' }}>{stats.topEmotions[0].emotion}</span>
        </p>
      )}

      <button
        className="loom-btn"
        style={{
          fontSize: 11,
          ...fadeRise(mounted, { delay: 1000, dur: 720, y: 16 }),
        }}
      >
        Share your wrapped
      </button>
    </SlideWrap>
  );
};

/* ─── Main Wrapped component ─────────────────────────────────────── */
const SLIDE_DURATION = 6000;

const Wrapped: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('wrapped-muted');
    return saved !== null ? saved === 'true' : true;
  });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Initialize audio
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    audioRef.current = new Audio(THEME_MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle mute state changes
  useEffect(() => {
    localStorage.setItem('wrapped-muted', String(isMuted));
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else if (isAutoPlaying) {
        audioRef.current.play().catch(() => setIsMuted(true));
      }
    }
  }, [isMuted, isAutoPlaying]);

  // Share functionality
  const handleShare = async (platform: 'twitter' | 'facebook' | 'copy' | 'native') => {
    const shareText = `Check out my ${selectedYear} Heirloom Wrapped! I created ${stats.totalMemories} memories and ${stats.totalVoiceStories} voice stories this year. #HeirloomWrapped #FamilyLegacy`;
    const shareUrl = window.location.href;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Copied to clipboard!');
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({ title: `My ${selectedYear} Heirloom Wrapped`, text: shareText, url: shareUrl });
          } catch (_) {
            // cancelled
          }
        }
        break;
    }
    setShowShareMenu(false);
  };

  // Fetch available years
  const { data: yearsData } = useQuery({
    queryKey: ['wrapped-years'],
    queryFn: async () => {
      const response = await wrappedApi.getYears();
      return response.data;
    },
  });

  const availableYears = useMemo(() => {
    if (yearsData?.years && yearsData.years.length > 0) {
      return yearsData.years.sort((a: number, b: number) => b - a);
    }
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [yearsData, currentYear]);

  // Fetch wrapped data
  const { data: apiData } = useQuery({
    queryKey: ['wrapped', selectedYear],
    queryFn: async () => {
      if (selectedYear === currentYear) {
        const response = await wrappedApi.getCurrent();
        return response.data;
      } else {
        const response = await wrappedApi.getYear(selectedYear);
        return response.data;
      }
    },
  });

  const stats: WrappedStats = apiData ? transformApiResponse(apiData) : getDefaultStats();
  const year = selectedYear;

  // Slide list — keyed so each remount triggers useEntrance() fresh
  const slides = [
    <IntroSlide key={`intro-${currentSlide === 0 ? 'a' : 'b'}`} year={year} />,
    <TotalMemoriesSlide key={`memories-${currentSlide === 1 ? 'a' : 'b'}`} stats={stats} />,
    <VoiceStoriesSlide key={`voices-${currentSlide === 2 ? 'a' : 'b'}`} stats={stats} />,
    <EmotionsSlide key={`emotions-${currentSlide === 3 ? 'a' : 'b'}`} stats={stats} />,
    <FamilySlide key={`family-${currentSlide === 4 ? 'a' : 'b'}`} stats={stats} />,
    <StreakSlide key={`streak-${currentSlide === 5 ? 'a' : 'b'}`} stats={stats} />,
    <WordCloudSlide key={`words-${currentSlide === 6 ? 'a' : 'b'}`} stats={stats} />,
    <LettersSlide key={`letters-${currentSlide === 7 ? 'a' : 'b'}`} stats={stats} />,
    <SummarySlide key={`summary-${currentSlide === 8 ? 'a' : 'b'}`} stats={stats} year={year} />,
  ];

  // Progress & auto-advance
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (!isAutoPlaying) return;

    setProgress(0);
    const progressStep = (50 / SLIDE_DURATION) * 100;
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((curr) => {
            if (curr < slides.length - 1) return curr + 1;
            setIsAutoPlaying(false);
            return curr;
          });
          return 0;
        }
        return prev + progressStep;
      });
    }, 50);

    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, [isAutoPlaying, currentSlide, slides.length]);

  const togglePlayPause = useCallback(() => setIsAutoPlaying((prev) => !prev), []);

  // Touch/swipe — pointer-based, no framer-motion drag
  const pointerStartX = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (dx < -50 && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setIsAutoPlaying(false);
    } else if (dx > 50 && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setIsAutoPlaying(false);
    }
  }, [currentSlide, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1);
        setIsAutoPlaying(false);
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
        setIsAutoPlaying(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length]);

  /* ── Overlay button style helpers ─────────────────────────────── */
  const overlayBtn: React.CSSProperties = {
    background: 'rgba(14,14,12,0.72)',
    border: '1px solid var(--loom-rule)',
    color: 'var(--loom-bone-dim)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.12em',
    padding: '6px 12px',
    cursor: 'pointer',
    borderRadius: 0,
    transition: 'border-color 180ms var(--loom-ease), color 180ms var(--loom-ease)',
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, background: 'var(--loom-ink)', color: 'var(--loom-bone)', overflow: 'hidden' }}
    >
      {/* Horizon glow */}
      <div className="loom-horizon" style={{ pointerEvents: 'none' }} />
      <div className="loom-grain" style={{ pointerEvents: 'none' }} />

      {/* Progress hairlines */}
      <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3, zIndex: 50, width: '100%', maxWidth: 480, padding: '0 24px' }}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => { setCurrentSlide(index); setProgress(0); setIsAutoPlaying(true); }}
            style={{ flex: 1, height: 1, background: 'var(--loom-rule)', position: 'relative', overflow: 'visible', border: 'none', padding: 0, cursor: 'pointer' }}
            aria-label={`Go to slide ${index + 1}`}
          >
            <div
              style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                background: 'var(--loom-bone-dim)',
                width: index < currentSlide ? '100%' : index === currentSlide ? `${progress}%` : '0%',
                transition: 'width 75ms linear',
              }}
            />
          </button>
        ))}
      </div>

      {/* Year selector — top-left */}
      <div style={{ position: 'absolute', top: 52, left: 24, display: 'flex', alignItems: 'center', gap: 6, zIndex: 50 }}>
        <button
          onClick={() => {
            const idx = availableYears.indexOf(selectedYear);
            if (idx < availableYears.length - 1) { setSelectedYear(availableYears[idx + 1]); setCurrentSlide(0); }
          }}
          disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
          style={{ ...overlayBtn, padding: '6px 10px', opacity: availableYears.indexOf(selectedYear) === availableYears.length - 1 ? 0.3 : 1 }}
          aria-label="Previous year"
        >
          ←
        </button>
        <span style={{ ...overlayBtn, cursor: 'default', fontFamily: "'Source Serif 4', serif", fontStyle: 'italic', fontSize: 16, color: 'var(--loom-bone)' }}>
          {selectedYear}
        </span>
        <button
          onClick={() => {
            const idx = availableYears.indexOf(selectedYear);
            if (idx > 0) { setSelectedYear(availableYears[idx - 1]); setCurrentSlide(0); }
          }}
          disabled={availableYears.indexOf(selectedYear) === 0}
          style={{ ...overlayBtn, padding: '6px 10px', opacity: availableYears.indexOf(selectedYear) === 0 ? 0.3 : 1 }}
          aria-label="Next year"
        >
          →
        </button>
      </div>

      {/* Back button — top-right */}
      <button
        onClick={() => window.location.href = '/dashboard'}
        style={{ ...overlayBtn, position: 'absolute', top: 52, right: 24, zIndex: 50 }}
      >
        ← Back
      </button>

      {/* Share button — top-right, below back */}
      <div style={{ position: 'absolute', top: 94, right: 24, zIndex: 50 }}>
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          style={overlayBtn}
        >
          Share
        </button>
        {showShareMenu && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: 'var(--loom-ink)', border: '1px solid var(--loom-rule)', minWidth: 148 }}>
            {(['native', 'twitter', 'facebook', 'copy'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleShare(p)}
                style={{ ...overlayBtn, display: 'block', width: '100%', textAlign: 'left', border: 'none', borderBottom: '1px solid var(--loom-rule)', background: 'none' }}
              >
                {p === 'native' ? 'Share…' : p === 'twitter' ? 'Post on X' : p === 'facebook' ? 'Share on Facebook' : 'Copy Link'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Slide content — pointer handlers replace framer-motion drag */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        style={{ height: '100%', touchAction: 'pan-y' }}
      >
        {slides[currentSlide]}
      </div>

      {/* Controls — bottom */}
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, zIndex: 50 }}>
        <button
          onClick={() => { if (currentSlide > 0) { setCurrentSlide(currentSlide - 1); setProgress(0); } }}
          disabled={currentSlide === 0}
          style={{ ...overlayBtn, opacity: currentSlide === 0 ? 0.3 : 1 }}
          aria-label="Previous slide"
        >
          ←
        </button>

        <button
          onClick={togglePlayPause}
          style={{ ...overlayBtn, border: '1px solid var(--loom-rule-warm)', color: 'var(--loom-warm)' }}
        >
          {isAutoPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={() => { if (currentSlide < slides.length - 1) { setCurrentSlide(currentSlide + 1); setProgress(0); } }}
          disabled={currentSlide === slides.length - 1}
          style={{ ...overlayBtn, opacity: currentSlide === slides.length - 1 ? 0.3 : 1 }}
          aria-label="Next slide"
        >
          →
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{ ...overlayBtn, marginLeft: 12 }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? 'Muted' : 'Sound'}
        </button>
      </div>
    </div>
  );
};

export default Wrapped;
