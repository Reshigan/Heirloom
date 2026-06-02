import { useEffect, useState } from 'react';
import { LoomShell } from '../components/LoomShell';
import { Frame } from '../components/Frame';

/**
 * Screen 05 — The Unlock
 *
 * The product's ONLY ceremony, and it is made of type, not theatre.
 * STITCH_BRIEF §1.5-D / §2.5: when a tied-off thread reaches its date the
 * transformation is a single 720ms typographic cross-fade — the ∞ and the
 * sealed-date dissolve as the entry's title and prose fade up in warm. Nothing
 * burns, melts, sparks, or glows. §2.6 forbids the fire/wax/key/vault family of
 * literal-metaphor objects, glassmorphism, gradient meshes, drop shadows, and
 * floating cards that translate on entry — this screen used to do all of them.
 *
 *   phase 0  sealed     — ∞ + the sealed dates, at rest
 *   phase 1  dissolve    — the 720ms cross-fade (∞/date out, letter in)
 *   phase 2  the letter  — the prose, readable
 *   phase 3  the artifact— a portrait card to pass to descendants
 *
 * The sequence loops on a calm cadence; the top-bar right slot toggles it.
 */
const VEIL = 'opacity var(--loom-dur-veil) var(--loom-ease)';

export function Unlock() {
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      setPhase(0);
      timers.push(setTimeout(() => setPhase(1), 2200)); // the dissolve begins
      timers.push(setTimeout(() => setPhase(2), 2920)); // 720ms later: letter settled
      timers.push(setTimeout(() => setPhase(3), 8000)); // the artifact
      timers.push(setTimeout(() => cycle(), 13500));
    };
    cycle();
    return () => timers.forEach(clearTimeout);
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
              aria-hidden
              style={{ width: 5, height: 5, background: 'var(--warm)' }}
            />
            a thread unties · today
            <span
              onClick={() => setPaused((p) => !p)}
              style={{
                cursor: 'pointer',
                borderLeft: '1px solid var(--rule)',
                paddingLeft: 14,
                color: 'var(--bone-dim)',
              }}
            >
              {paused ? 'play' : 'pause'}
            </span>
          </span>
        }
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            padding: '44px 80px',
          }}
        >
          {/* meta header — present for the ceremony, gone for the artifact */}
          <div style={{ opacity: phase < 3 ? 1 : 0, transition: VEIL }}>
            <div className="loom-eyebrow" style={{ color: 'var(--warm)' }}>
              ∞ &nbsp; the loom · unlock
            </div>
            <div
              className="loom-mono"
              style={{ fontSize: 11, color: 'var(--bone-faint)', marginTop: 8 }}
            >
              tied off 2026·05·04 &nbsp;·&nbsp; opens 2055·11·08 &nbsp;·&nbsp; for iris
              hartshorn-vega &nbsp;·&nbsp; on her 31st
            </div>
          </div>

          {/* center stage — the 720ms typographic dissolve */}
          <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', width: 640, minHeight: 420 }}>
              {/* THE SEAL — ∞ + sealed date, dissolving out */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  opacity: phase < 1 ? 1 : 0,
                  transition: VEIL,
                  pointerEvents: 'none',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Source Serif 4', serif",
                      fontVariationSettings: "'opsz' 72",
                      fontSize: 132,
                      fontWeight: 300,
                      lineHeight: 1,
                      color: 'var(--warm)',
                    }}
                  >
                    ∞
                  </div>
                  <div
                    className="loom-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--bone-faint)',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      marginTop: 22,
                    }}
                  >
                    sealed · twenty-nine years
                  </div>
                </div>
              </div>

              {/* THE LETTER — fading up in its place */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  opacity: phase >= 1 && phase < 3 ? 1 : 0,
                  transition: VEIL,
                  pointerEvents: phase >= 1 && phase < 3 ? 'auto' : 'none',
                }}
              >
                <div style={{ maxWidth: 560, textAlign: 'left' }}>
                  <div
                    className="loom-mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--warm)',
                      letterSpacing: '0.04em',
                      paddingBottom: 14,
                      borderBottom: '1px solid var(--rule)',
                      marginBottom: 22,
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
                      color: 'var(--warm)',
                    }}
                  >
                    Iris,
                  </div>
                  <div
                    className="loom-body"
                    style={{
                      fontSize: 17,
                      color: 'var(--bone)',
                      lineHeight: 1.85,
                      textWrap: 'pretty',
                      fontVariationSettings: "'opsz' 14",
                    }}
                  >
                    Thirty-one is the age I was when your mother was born. The kitchen window had
                    daffodils that year too — slanted late-may light, the color of a strong tea. I
                    want you to know:&nbsp;
                    <span className="loom-warm-text" style={{ fontStyle: 'italic' }}>
                      everything I will never get to tell you, I have woven into this thread.
                    </span>
                    &nbsp;Hold it lightly. Pass it on.
                  </div>
                  <div
                    style={{
                      marginTop: 24,
                      fontFamily: "'Source Serif 4', serif",
                      fontVariationSettings: "'opsz' 28",
                      fontSize: 22,
                      fontStyle: 'italic',
                      fontWeight: 300,
                      color: 'var(--bone-dim)',
                    }}
                  >
                    — Eleanor
                  </div>
                </div>
              </div>

              {/* THE ARTIFACT — fades in (opacity only, no float) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  opacity: phase >= 3 ? 1 : 0,
                  transition: VEIL,
                  pointerEvents: phase < 3 ? 'none' : 'auto',
                }}
              >
                <ShareCard />
              </div>
            </div>
          </div>

          {/* phase indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.7 }}>
            {['sealed', 'the dissolve', 'the letter', 'the artifact'].map((label, i) => (
              <div
                key={label}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: phase === i ? 'var(--warm)' : 'var(--bone-faint)',
                  padding: '4px 14px',
                  borderRight: i < 3 ? '1px solid var(--rule)' : 'none',
                  transition: 'color var(--loom-dur-shift) var(--loom-ease)',
                }}
              >
                {String(i + 1).padStart(2, '0')} {label}
              </div>
            ))}
          </div>
        </div>
      </Frame>
    </LoomShell>
  );
}

/* ─── The artifact — a portrait card to pass on. Type on ink, one hairline,
   one warm accent. No gradients, no glow, no shadow (§2.6). ───────────────── */
function ShareCard() {
  return (
    <div
      style={{
        width: 280,
        height: 498,
        background: 'var(--ink-card)',
        border: '1px solid var(--rule-warm)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        padding: '28px 22px',
      }}
    >
      <div
        className="loom-mono"
        style={{
          fontSize: 9,
          color: 'var(--bone-faint)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        ∞ &nbsp; heirloom · the loom
      </div>

      <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontVariationSettings: "'opsz' 72",
              fontSize: 56,
              fontWeight: 300,
              color: 'var(--warm)',
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
              color: 'var(--bone)',
              lineHeight: 1.45,
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
            className="loom-mono"
            style={{
              borderTop: '1px solid var(--rule)',
              borderBottom: '1px solid var(--rule)',
              padding: '16px 0',
              margin: '0 -8px',
              fontSize: 10,
              color: 'var(--bone-dim)',
              letterSpacing: '0.05em',
            }}
          >
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: 'var(--warm)' }}>·</span> sealed 2026·05·04
            </div>
            <div>
              <span style={{ color: 'var(--warm)' }}>·</span> opened 2055·11·08
            </div>
          </div>

          <div
            className="loom-serif"
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              color: 'var(--bone-dim)',
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingTop: 16,
          borderTop: '1px solid var(--rule)',
        }}
      >
        <span
          className="loom-mono"
          style={{ fontSize: 8, color: 'var(--bone-faint)', letterSpacing: '0.12em' }}
        >
          heirloom.blue
        </span>
        <span
          className="loom-mono"
          style={{ fontSize: 8, color: 'var(--warm)', letterSpacing: '0.12em' }}
        >
          /iris
        </span>
      </div>
    </div>
  );
}
