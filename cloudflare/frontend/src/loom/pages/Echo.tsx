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

/**
 * The braid — three hairline dye strands running between the two letters.
 * No SVG (§2.6): the braid is achieved with 1px DOM rules — thin warm
 * verticals that draw to full height and warm on match, plus a dashed
 * spine — so the resonance reads as woven thread, not a chart graphic.
 */
function Braid({ matched }: { matched: boolean }) {
  const ease = 'cubic-bezier(0.16,1,0.3,1)';
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: 80,
        height: '100%',
        opacity: matched ? 0.85 : 0.22,
        transition: `opacity 1400ms ${ease}`,
      }}
    >
      {/* dashed spine — the warp the strands cross */}
      <div
        style={{
          position: 'absolute',
          left: 'calc(50% - 0.5px)',
          top: 0,
          bottom: 0,
          width: 1,
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--loom-warm) 0 2px, transparent 2px 6px)',
          opacity: 0.6,
        }}
      />
      {/* three dye strands — offset verticals that grow + warm on match */}
      {[
        { left: '26%', dye: 'var(--dye-indigo)', delay: '0ms' },
        { left: '50%', dye: 'var(--loom-warm)', delay: '180ms' },
        { left: '74%', dye: 'var(--dye-madder)', delay: '360ms' },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(${s.left} - 0.5px)`,
            top: 0,
            width: 1,
            height: matched ? '100%' : '0%',
            background: matched ? s.dye : 'var(--loom-warm)',
            opacity: matched ? 0.7 : 0.35,
            transition: `height 1400ms ${ease}, opacity 1400ms ${ease}, background 1400ms ${ease}`,
            transitionDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
