import { useEffect, useState, type ReactNode } from 'react';
import { LoomShell } from '../components/LoomShell';
import { Frame } from '../components/Frame';

/**
 * Screen 06 — The Echo
 *
 * Side-by-side: an entry the user wrote tonight, and one their mother
 * wrote 38 years ago, that the AI says rhyme. Shared phrases highlight
 * in warm color; a braid of warm strands runs between the two columns.
 *
 * This is the share-worthy proof: the moment the loom delivers on the
 * thesis. Loops every 9.5s on the demo so the rhyme always finds you.
 */
export function Echo() {
  const [revealed, setRevealed] = useState(false);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      setRevealed(false);
      setMatched(false);
      timers.push(setTimeout(() => setRevealed(true), 500));
      timers.push(setTimeout(() => setMatched(true), 2400));
      timers.push(setTimeout(() => cycle(), 9500));
    };
    cycle();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <LoomShell>
      <Frame
        active="weft"
        right={<span className="loom-mono loom-faint">the loom found this · 38 yrs apart</span>}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '44px 80px 0',
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            gap: 32,
          }}
        >
          <div>
            <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)' }}>
              ∞ &nbsp; resonance · 1988 — 2026
            </div>
            <div
              className="loom-h2"
              style={{ fontSize: 40, marginTop: 12, fontWeight: 300, fontStyle: 'italic' }}
            >
              the loom found this. it had been waiting thirty-eight&nbsp;years.
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: 0,
              alignItems: 'stretch',
              position: 'relative',
            }}
          >
            <Letter
              who="Margaret Wells Hartshorn"
              relation="your mother"
              date="1988 · 03 · 14"
              place="oak street, kitchen, before dawn"
              age="age 60"
              revealed={revealed}
              side="left"
            >
              <p>
                The light came in through the daffodils this morning the way it does in late
                march —{' '}
                <Mark on={matched}>slanted, low, the color of a strong tea</Mark>. I have been
                thinking about my mother all week. She used to sit here.
              </p>
              <p>
                I do not know who will read this.{' '}
                <Mark on={matched}>I want you to know — here, hold this —</Mark> the women in this
                kitchen do not get to keep each other for very long. We get the window. We get the
                daffodils. We get the late-March light.
              </p>
              <p>That is enough.</p>
            </Letter>

            <div
              style={{
                position: 'relative',
                width: 80,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Braid matched={matched} />
            </div>

            <Letter
              who="Eleanor Hartshorn"
              relation="you"
              date="2026 · 05 · 04"
              place="oak street, kitchen, 22:14"
              age="age 67"
              revealed={revealed}
              side="right"
            >
              <p>
                Tonight I sat at the kitchen window.{' '}
                <Mark on={matched}>
                  The light came through the daffodils the way it used to when my mother was alive
                  — slanted, low, the color of a strong tea.
                </Mark>{' '}
                I thought I should write this down before it goes.
              </p>
              <p>
                I do not know who will read it. Maybe Iris, in some year I will not see.{' '}
                <Mark on={matched}>I want you to know — here, hold this —</Mark> we don't get to
                keep each other for as long as we want. But we get the window. We get the late-may
                light. We get this.
              </p>
            </Letter>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 24,
              padding: '24px 0 28px',
              borderTop: '1px solid var(--loom-rule)',
              alignItems: 'end',
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <div className="loom-eyebrow">the loom's note</div>
              <div
                className="loom-body"
                style={{
                  fontSize: 16,
                  fontStyle: 'italic',
                  color: 'var(--loom-bone-dim)',
                  lineHeight: 1.7,
                  marginTop: 10,
                  textWrap: 'pretty',
                }}
              >
                two letters. <span className="loom-warm-text">six phrases shared</span>, three of
                them verbatim. both written before dawn or late at night, both at the same window,
                both addressed to a reader the writer would never meet. neither knew the other had
                written this.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="loom-btn-ghost">save the rhyme</button>
              <button className="loom-btn">share to descendants</button>
            </div>
          </div>
        </div>
      </Frame>
    </LoomShell>
  );
}

function Letter({
  who,
  relation,
  date,
  place,
  age,
  children,
  revealed,
  side,
}: {
  who: string;
  relation: string;
  date: string;
  place: string;
  age: string;
  children: ReactNode;
  revealed: boolean;
  side: 'left' | 'right';
}) {
  return (
    <div
      style={{
        padding: '22px 28px',
        background: 'rgba(244,236,216,0.012)',
        border: '1px solid var(--loom-rule)',
        borderRight: side === 'left' ? 'none' : '1px solid var(--loom-rule)',
        borderLeft: side === 'right' ? 'none' : '1px solid var(--loom-rule)',
        opacity: revealed ? 1 : 0,
        transform: revealed
          ? 'translateX(0)'
          : side === 'left'
            ? 'translateX(-12px)'
            : 'translateX(12px)',
        transition:
          'opacity 1200ms cubic-bezier(0.16,1,0.3,1), transform 1200ms cubic-bezier(0.16,1,0.3,1)',
        transitionDelay: side === 'left' ? '0ms' : '200ms',
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <div
          className="loom-serif"
          style={{
            fontVariationSettings: "'opsz' 28",
            fontSize: 18,
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--loom-warm)',
          }}
        >
          {who}
        </div>
        <div
          className="loom-mono"
          style={{
            fontSize: 9,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {relation}
        </div>
      </div>
      <div
        className="loom-mono"
        style={{
          fontSize: 10,
          color: 'var(--loom-bone-faint)',
          letterSpacing: '0.04em',
          marginBottom: 18,
        }}
      >
        {date} &nbsp;·&nbsp; {place} &nbsp;·&nbsp; {age}
      </div>
      <div
        className="loom-body"
        style={{
          fontSize: 15,
          color: 'var(--loom-bone)',
          lineHeight: 1.85,
          textWrap: 'pretty',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Mark({ children, on }: { children: ReactNode; on: boolean }) {
  return (
    <span
      style={{
        color: on ? 'var(--loom-warm-bright)' : 'var(--loom-bone)',
        backgroundImage: on
          ? 'linear-gradient(to bottom, transparent 92%, var(--loom-warm) 92%, var(--loom-warm) 100%)'
          : 'none',
        backgroundSize: on ? '100% 100%' : '0 100%',
        transition:
          'color 1200ms cubic-bezier(0.16,1,0.3,1), background-size 1200ms cubic-bezier(0.16,1,0.3,1)',
        fontStyle: 'italic',
      }}
    >
      {children}
    </span>
  );
}

function Braid({ matched }: { matched: boolean }) {
  return (
    <svg
      width="80"
      height="100%"
      viewBox="0 0 80 400"
      preserveAspectRatio="none"
      style={{
        opacity: matched ? 0.85 : 0.18,
        transition: 'opacity 1400ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const offset = i * 70;
        return (
          <path
            key={i}
            d={`M 0 ${offset} C 80 ${offset + 20}, 0 ${offset + 50}, 80 ${offset + 70}`}
            stroke="var(--loom-warm)"
            strokeWidth="1"
            fill="none"
            opacity={matched ? 0.6 : 0.3}
          />
        );
      })}
      <line
        x1="40"
        y1="0"
        x2="40"
        y2="400"
        stroke="var(--loom-warm)"
        strokeWidth="1"
        opacity="0.6"
        strokeDasharray="2 4"
      />
      {matched
        ? [80, 200, 320].map((y, i) => (
            <circle key={i} cx="40" cy={y} r="3" fill="var(--loom-warm-bright)">
              <animate
                attributeName="r"
                values="3;5;3"
                dur="2.4s"
                begin={`${i * 0.4}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))
        : null}
    </svg>
  );
}
