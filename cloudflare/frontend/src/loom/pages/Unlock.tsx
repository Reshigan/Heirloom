import { useEffect, useState } from 'react';
import { LoomShell } from '../components/LoomShell';
import { Frame } from '../components/Frame';

/**
 * Screen 05 — The Unlock
 *
 * The 4-second signature motion of the product. When a tied-off
 * thread reaches its date, this is what happens:
 *
 *   phase 0  hush          — sealed, breathing
 *   phase 1  ignition      — a glint at the cord's end
 *   phase 2  the cord burns— the cord is consumed left-to-right
 *   phase 3  the wax melts — the seal slumps into a wax pool
 *   phase 4  the cloth     — a folded letter unfurls in its place
 *   phase 5  the letter    — the prose fades in
 *   phase 6  share card    — a vertical 9:16 artifact suitable for
 *                            sending to descendants
 *
 * The room dims for the duration; whoever is reading at that moment
 * is the recipient. The whole sequence loops on a 14.5s cadence; the
 * top-bar right slot has a play/pause toggle.
 *
 * Adapted from screen-unlock.jsx in the design handoff. All character
 * encoding cleaned up to proper unicode (— · ∞ →).
 */
export function Unlock() {
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      setPhase(0);
      timers.push(setTimeout(() => setPhase(1), 900));
      timers.push(setTimeout(() => setPhase(2), 1500));
      timers.push(setTimeout(() => setPhase(3), 3000));
      timers.push(setTimeout(() => setPhase(4), 4400));
      timers.push(setTimeout(() => setPhase(5), 5800));
      timers.push(setTimeout(() => setPhase(6), 9500));
      timers.push(setTimeout(() => cycle(), 14500));
    };
    cycle();
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [paused]);

  return (
    <LoomShell>
      <Frame
        active="weft"
        right={
          <span
            className="loom-mono loom-faint"
            style={{ display: 'flex', gap: 14, alignItems: 'center' }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--loom-warm)',
                boxShadow: '0 0 8px var(--loom-warm)',
                animation: 'loom-breathe 2.4s ease-in-out infinite',
              }}
            />
            a thread unties · today
            <span
              onClick={() => setPaused((p) => !p)}
              style={{
                cursor: 'pointer',
                borderLeft: '1px solid var(--loom-rule)',
                paddingLeft: 14,
                color: 'var(--loom-bone-dim)',
              }}
            >
              {paused ? 'play' : 'pause'}
            </span>
          </span>
        }
      >
        {/* dim the room while the unlock plays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 56%, transparent 0%, rgba(0,0,0,0.55) 90%)',
            pointerEvents: 'none',
            opacity: phase < 6 ? 1 : 0.4,
            transition: 'opacity 1200ms cubic-bezier(0.16,1,0.3,1)',
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            padding: '44px 80px',
            zIndex: 2,
          }}
        >
          {/* meta header — fades out for the share card */}
          <div
            style={{
              opacity: phase < 6 ? 1 : 0,
              transition: 'opacity 720ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)' }}>
              ∞ &nbsp; the loom · unlock
            </div>
            <div
              className="loom-mono"
              style={{ fontSize: 11, color: 'var(--loom-bone-faint)', marginTop: 8 }}
            >
              tied off 2026·05·04 &nbsp;·&nbsp; opens 2055·11·08 &nbsp;·&nbsp; for iris
              hartshorn-vega &nbsp;·&nbsp; on her 31st
            </div>
          </div>

          {/* center stage */}
          <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', width: 760, height: 460 }}>
              {/* THE CORD */}
              <div
                style={{
                  position: 'absolute',
                  top: '32%',
                  left: '8%',
                  right: '8%',
                  height: 1,
                  opacity: phase < 3 ? 1 : 0,
                  transition: 'opacity 720ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--loom-bone-dim)',
                    clipPath: phase >= 2 ? 'inset(0 0 0 100%)' : 'inset(0 0 0 0)',
                    transition: 'clip-path 1500ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    height: 12,
                    width: 80,
                    left: phase >= 2 ? 'calc(100% - 40px)' : '-40px',
                    background:
                      'radial-gradient(circle, var(--loom-warm-bright) 0%, var(--loom-warm) 30%, transparent 70%)',
                    filter: 'blur(2px)',
                    opacity: phase >= 1 && phase < 3 ? 1 : 0,
                    transition:
                      'left 1500ms cubic-bezier(0.16,1,0.3,1), opacity 360ms',
                  }}
                />
                {phase >= 1 && phase < 3
                  ? [0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: 2,
                          height: 2,
                          borderRadius: '50%',
                          background: 'var(--loom-warm-bright)',
                          boxShadow: '0 0 4px var(--loom-warm-bright)',
                          animation: `loom-spark-${i % 3} ${
                            1200 + i * 150
                          }ms ease-out ${i * 180}ms forwards`,
                        }}
                      />
                    ))
                  : null}
              </div>

              {/* THE WAX SEAL */}
              <div
                style={{
                  position: 'absolute',
                  top: '30%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: phase < 4 ? 1 : 0,
                  transition: 'opacity 1200ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: phase >= 3 ? 180 : 110,
                    height: phase >= 3 ? 50 : 110,
                    borderRadius: phase >= 3 ? '50% / 100% 100% 0 0' : '50%',
                    background:
                      phase >= 3
                        ? 'radial-gradient(ellipse at 50% 0%, var(--loom-warm-bright) 0%, var(--loom-warm) 40%, var(--loom-warm-dim) 90%)'
                        : 'radial-gradient(circle at 35% 30%, var(--loom-warm-bright) 0%, var(--loom-warm) 50%, var(--loom-warm-dim) 95%)',
                    boxShadow:
                      phase >= 3
                        ? '0 20px 40px rgba(207,147,90,0.4), inset 0 -8px 20px rgba(0,0,0,0.3)'
                        : '0 0 30px var(--loom-warm-glow), inset -8px -8px 14px rgba(0,0,0,0.35), inset 6px 6px 10px rgba(255,200,140,0.2)',
                    animation:
                      phase < 3
                        ? 'loom-breathe-seal 4s cubic-bezier(0.16,1,0.3,1) infinite'
                        : 'none',
                    transition: 'all 1400ms cubic-bezier(0.16,1,0.3,1)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Newsreader', serif",
                      fontVariationSettings: "'opsz' 72",
                      fontSize: phase >= 3 ? 0 : 56,
                      fontWeight: 300,
                      color: 'rgba(20, 8, 0, 0.55)',
                      lineHeight: 1,
                      textShadow: '0 1px 0 rgba(255,200,140,0.25)',
                      transition: 'font-size 800ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    ∞
                  </span>

                  {phase >= 3 ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 220,
                        height: 28,
                        background:
                          'radial-gradient(ellipse at 50% 0%, var(--loom-warm) 0%, var(--loom-warm-dim) 50%, transparent 90%)',
                        borderRadius: '50%',
                        filter: 'blur(0.6px)',
                        opacity: 0.85,
                        animation: 'loom-wax-pool 1400ms cubic-bezier(0.16,1,0.3,1) forwards',
                      }}
                    />
                  ) : null}
                </div>
              </div>

              {/* THE CLOTH UNFOLDING + THE LETTER */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: phase >= 4 && phase < 6 ? 1 : 0,
                  transition: 'opacity 1200ms cubic-bezier(0.16,1,0.3,1)',
                  display: 'grid',
                  placeItems: 'center',
                  pointerEvents: phase < 4 || phase >= 6 ? 'none' : 'auto',
                }}
              >
                <div
                  style={{
                    width: phase >= 4 ? 600 : 0,
                    height: phase >= 4 ? 360 : 0,
                    background: `
                      repeating-linear-gradient(to right, rgba(244,236,216,0.06) 0, rgba(244,236,216,0.06) 1px, transparent 1px, transparent 5px),
                      repeating-linear-gradient(to bottom, rgba(244,236,216,0.04) 0, rgba(244,236,216,0.04) 1px, transparent 1px, transparent 7px),
                      linear-gradient(135deg, #1a1612 0%, #0f0c08 100%)
                    `,
                    border: '1px solid rgba(176,122,74,0.2)',
                    boxShadow:
                      '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(176,122,74,0.15)',
                    transition:
                      'width 1400ms cubic-bezier(0.16,1,0.3,1), height 1400ms cubic-bezier(0.16,1,0.3,1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      padding: '44px 56px',
                      opacity: phase >= 5 ? 1 : 0,
                      transition: 'opacity 1400ms cubic-bezier(0.16,1,0.3,1)',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      className="loom-mono"
                      style={{
                        fontSize: 10,
                        color: 'var(--loom-warm)',
                        marginBottom: 14,
                        letterSpacing: '0.04em',
                      }}
                    >
                      written 2026 · 05 · 04 &nbsp;·&nbsp; oak street, kitchen, 22:14
                    </div>
                    <div
                      className="loom-serif"
                      style={{
                        fontSize: 28,
                        fontStyle: 'italic',
                        marginBottom: 18,
                        fontWeight: 300,
                        color: 'var(--loom-warm-bright)',
                      }}
                    >
                      Iris,
                    </div>
                    <div
                      className="loom-body"
                      style={{
                        fontSize: 17,
                        color: 'var(--loom-bone)',
                        lineHeight: 1.85,
                        textWrap: 'pretty',
                        fontVariationSettings: "'opsz' 14",
                      }}
                    >
                      Thirty-one is the age I was when your mother was born. The kitchen window had
                      daffodils that year too — slanted late-may light, the color of a strong tea.
                      I want you to know:&nbsp;
                      <span style={{ color: 'var(--loom-warm-bright)', fontStyle: 'italic' }}>
                        everything I will never get to tell you, I have woven into this thread.
                      </span>
                      &nbsp;Hold it lightly. Pass it on.
                    </div>
                    <div
                      style={{
                        marginTop: 24,
                        fontFamily: "'Newsreader', serif",
                        fontVariationSettings: "'opsz' 28",
                        fontSize: 22,
                        fontStyle: 'italic',
                        fontWeight: 300,
                        color: 'var(--loom-bone-dim)',
                      }}
                    >
                      — Eleanor
                    </div>
                  </div>
                </div>
              </div>

              {/* SHARE CARD */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  opacity: phase >= 6 ? 1 : 0,
                  transform: phase >= 6 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
                  transition:
                    'opacity 1200ms cubic-bezier(0.16,1,0.3,1), transform 1200ms cubic-bezier(0.16,1,0.3,1)',
                  pointerEvents: phase < 6 ? 'none' : 'auto',
                }}
              >
                <ShareCard />
              </div>
            </div>
          </div>

          {/* phase indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, opacity: 0.7 }}>
            {['sealed', 'ignition', 'the cord', 'the wax', 'the cloth', 'the letter', 'share'].map(
              (label, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: phase === i ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                    padding: '4px 14px',
                    borderRight: i < 6 ? '1px solid var(--loom-rule)' : 'none',
                    transition: 'color 360ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')} {label}
                </div>
              ),
            )}
          </div>
        </div>

        <style>{`
          @keyframes loom-breathe-seal {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50%      { transform: scale(1.04); filter: brightness(1.18); }
          }
          @keyframes loom-wax-pool {
            0%   { opacity: 0; transform: translateX(-50%) scaleY(0); }
            100% { opacity: 0.85; transform: translateX(-50%) scaleY(1); }
          }
          @keyframes loom-spark-0 {
            0%   { transform: translate(0, 0); opacity: 1; }
            100% { transform: translate(8px, 60px); opacity: 0; }
          }
          @keyframes loom-spark-1 {
            0%   { transform: translate(0, 0); opacity: 1; }
            100% { transform: translate(-6px, 80px); opacity: 0; }
          }
          @keyframes loom-spark-2 {
            0%   { transform: translate(0, 0); opacity: 1; }
            100% { transform: translate(2px, 50px); opacity: 0; }
          }
        `}</style>
      </Frame>
    </LoomShell>
  );
}

/* ─── The Share Card — viral artifact, 9:16 ─────────────────────── */
function ShareCard() {
  return (
    <div
      style={{
        width: 280,
        height: 498,
        background: 'linear-gradient(180deg, #0e0e0c 0%, #161310 100%)',
        border: '1px solid rgba(176,122,74,0.3)',
        boxShadow:
          '0 40px 120px rgba(0,0,0,0.7), 0 0 80px rgba(176,122,74,0.15)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        padding: '28px 22px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(207,147,90,0.22), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          className="loom-mono"
          style={{
            fontSize: 9,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          ∞ &nbsp; heirloom · the loom
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Newsreader', serif",
              fontVariationSettings: "'opsz' 72",
              fontSize: 56,
              fontWeight: 300,
              color: 'var(--loom-warm)',
              lineHeight: 0.95,
              letterSpacing: '-0.022em',
              marginBottom: 14,
            }}
          >
            29
          </div>
          <div
            className="loom-serif"
            style={{
              fontSize: 14,
              fontStyle: 'italic',
              color: 'var(--loom-bone)',
              lineHeight: 1.45,
              marginBottom: 26,
              maxWidth: 220,
              margin: '0 auto 26px',
            }}
          >
            years between
            <br />
            <span className="loom-warm-text">when she sealed it</span>
            <br />
            and
            <br />
            <span className="loom-warm-text">when you read it</span>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--loom-rule)',
              borderBottom: '1px solid var(--loom-rule)',
              padding: '16px 0',
              margin: '0 -8px',
            }}
          >
            <div
              className="loom-mono"
              style={{
                fontSize: 10,
                color: 'var(--loom-bone-dim)',
                letterSpacing: '0.05em',
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--loom-warm)' }}>·</span> sealed 2026·05·04
              </div>
              <div>
                <span style={{ color: 'var(--loom-warm)' }}>·</span> opened 2055·11·08
              </div>
            </div>
          </div>

          <div
            className="loom-serif"
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              color: 'var(--loom-bone-dim)',
              lineHeight: 1.5,
              marginTop: 18,
            }}
          >
            she was thirty-one
            <br />
            when she wrote it.
            <br />
            so are you.
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingTop: 16,
          borderTop: '1px solid var(--loom-rule)',
        }}
      >
        <span
          className="loom-mono"
          style={{ fontSize: 8, color: 'var(--loom-bone-faint)', letterSpacing: '0.12em' }}
        >
          heirloom.blue
        </span>
        <span
          className="loom-mono"
          style={{ fontSize: 8, color: 'var(--loom-warm)', letterSpacing: '0.12em' }}
        >
          /iris
        </span>
      </div>
    </div>
  );
}
