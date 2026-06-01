import { useEffect, useState } from 'react';
import { LoomShell } from '../components/LoomShell';
import { Frame } from '../components/Frame';
import { SealedNote } from '../components/SealedNote';

/**
 * Screen 03 — The Composer
 *
 * Writing a single entry. The text is set in Source Serif 4 at reading-
 * column scale; the date+place stamp sits beneath the title in mono.
 *
 * Three modes (mode toggle in top bar):
 *   paper  — prose entry, the default
 *   letter — a sealed note to a future recipient
 *   speak  — voice memo, microphone capture
 *
 * After the user pauses for ~2 seconds the AI surfaces past entries
 * that rhyme — as faint mono lines below the prose, not a chat bubble.
 * The right rail holds delivery (kin who'll receive it) and the
 * sealed-until note. Everything is encrypted in the browser; the
 * mono line at the right of the topbar makes that visible.
 *
 * Mocked: `fullText`, `whisper` lines. When the resonance backend
 * lands these come from /api/resonances/predict.
 */
const FULL_TEXT =
  'Tonight I sat at the kitchen window. The light came through the daffodils the way it used to when my mother was alive — slanted, low, the color of a strong tea. I thought I should write this down before it goes.';

type ComposerMode = 'paper' | 'letter' | 'speak';

export function Composer() {
  const [typed, setTyped] = useState('');
  const [showWhisper, setShowWhisper] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const [mode, setMode] = useState<ComposerMode>('paper');
  const [recording, setRecording] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  useEffect(() => {
    let i = 0;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      i += 1;
      setTyped(FULL_TEXT.slice(0, i));
      if (i < FULL_TEXT.length) {
        id = setTimeout(tick, 22 + Math.random() * 32);
      } else {
        setTimeout(() => setShowWhisper(true), 900);
        setTimeout(() => setShowSecond(true), 2400);
      }
    };
    id = setTimeout(tick, 600);
    return () => clearTimeout(id);
  }, []);

  return (
    <LoomShell>
      <Frame
        active="compose"
        right={<span className="loom-mono loom-faint">unsaved · encrypted in browser</span>}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
          }}
        >
          {/* center: the page */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* mode toggle row */}
            <div
              style={{
                display: 'flex',
                gap: 32,
                padding: '0 56px',
                borderBottom: '1px solid var(--loom-rule)',
                marginBottom: 0,
                flexShrink: 0,
              }}
            >
              {(['paper', 'letter', 'speak'] as ComposerMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    padding: '16px 0',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: mode === m ? 'var(--loom-bone)' : 'var(--loom-bone-faint)',
                    borderBottom: mode === m ? '1px solid var(--loom-warm)' : '1px solid transparent',
                    transition: 'color var(--loom-dur-fast) var(--loom-ease), border-color var(--loom-dur-fast) var(--loom-ease)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* paper mode */}
            {mode === 'paper' && (
              <div style={{ display: 'grid', placeItems: 'start center', padding: '72px 80px 0', overflowY: 'auto', flex: 1 }}>
                <div style={{ width: '100%', maxWidth: 660 }}>
                  <div className="loom-eyebrow" style={{ marginBottom: 28, color: 'var(--loom-warm)' }}>
                    ∞ &nbsp; entry · in your own hand
                  </div>

                  <div
                    className="loom-serif"
                    style={{
                      fontVariationSettings: "'opsz' 28",
                      fontSize: 30,
                      fontWeight: 300,
                      letterSpacing: '-0.008em',
                      marginBottom: 18,
                      lineHeight: 1.2,
                    }}
                  >
                    The kitchen window, in late may
                  </div>

                  <div
                    className="loom-mono"
                    style={{ fontSize: 11, color: 'var(--loom-bone-faint)', marginBottom: 36 }}
                  >
                    2026·05·05 · monday · 22:14 · oak street, kitchen
                  </div>

                  <div
                    className="loom-body"
                    style={{
                      fontSize: 19,
                      lineHeight: 1.85,
                      color: 'var(--loom-bone)',
                      minHeight: 220,
                    }}
                  >
                    {typed}
                    <span className="loom-caret" />
                  </div>

                  <div style={{ marginTop: 40, minHeight: 68 }}>
                    {showWhisper ? (
                      <div
                        className="loom-whisper"
                        style={{
                          opacity: 1,
                          transition: 'opacity 720ms cubic-bezier(0.16,1,0.3,1)',
                          display: 'block',
                        }}
                      >
                        <div style={{ marginBottom: 10 }}>
                          <span className="lead">∞</span>&nbsp; you wrote about the same window in{' '}
                          <span className="link">1992 · jan · 7</span> — the morning your mother died.
                        </div>
                        {showSecond ? (
                          <div
                            style={{
                              opacity: 1,
                              transition: 'opacity 720ms cubic-bezier(0.16,1,0.3,1)',
                            }}
                          >
                            <span className="lead">∞</span>&nbsp; maya, age 4, slept on this sill in{' '}
                            <span className="link">1995 · oct · 22</span>.
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 42, display: 'flex', gap: 28, alignItems: 'center' }}>
                    <button className="loom-btn">tie off · time-lock</button>
                    <button className="loom-btn-ghost">save to weft</button>
                    <span
                      className="loom-mono"
                      style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginLeft: 'auto' }}
                    >
                      ⌘ s
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* letter mode */}
            {mode === 'letter' && (
              <div style={{ display: 'grid', placeItems: 'start center', padding: '72px 80px 0', overflowY: 'auto', flex: 1 }}>
                <div style={{ width: '100%', maxWidth: 660 }}>
                  <div className="loom-eyebrow" style={{ marginBottom: 28, color: 'var(--loom-warm)' }}>
                    ∞ &nbsp; letter · sealed until opened
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label
                        className="loom-mono"
                        style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                      >
                        to
                      </label>
                      <input
                        className="hl-input"
                        type="text"
                        placeholder="recipient name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label
                        className="loom-mono"
                        style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                      >
                        ∞ &nbsp; unlock on
                      </label>
                      <input
                        className="hl-input"
                        type="text"
                        placeholder="2055·11·08 — or describe a moment"
                        value={unlockDate}
                        onChange={(e) => setUnlockDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div
                    className="loom-body"
                    style={{
                      fontSize: 19,
                      lineHeight: 1.85,
                      color: 'var(--loom-bone)',
                      minHeight: 220,
                    }}
                  >
                    {typed}
                    <span className="loom-caret" />
                  </div>

                  <div style={{ marginTop: 42, display: 'flex', gap: 28, alignItems: 'center' }}>
                    <button className="loom-btn">seal letter</button>
                    <button className="loom-btn-ghost">save draft</button>
                    <span
                      className="loom-mono"
                      style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginLeft: 'auto' }}
                    >
                      ⌘ s
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* speak mode */}
            {mode === 'speak' && (
              <div style={{ display: 'grid', placeItems: 'center', flex: 1, padding: '72px 80px' }}>
                <div style={{ width: '100%', maxWidth: 660, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
                  <div className="loom-eyebrow" style={{ color: 'var(--loom-warm)', alignSelf: 'flex-start' }}>
                    ∞ &nbsp; voice memo · spoken word
                  </div>

                  <button
                    type="button"
                    onClick={() => setRecording((r) => !r)}
                    style={{
                      background: 'transparent',
                      border: recording ? '1px solid var(--loom-warm)' : '1px solid var(--loom-rule)',
                      cursor: 'pointer',
                      width: 80,
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 360ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    <span
                      className="hl-mono"
                      style={{
                        fontSize: 11,
                        color: recording ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {recording ? '●' : '○'}
                    </span>
                  </button>

                  <span
                    className="hl-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--loom-bone-dim)',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {recording ? '● recording' : '○ tap to speak'}
                  </span>

                  {recording && (
                    <div
                      className="loom-mono"
                      style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.15em' }}
                    >
                      0:00
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', gap: 28 }}>
                    <button className="loom-btn" disabled={recording}>
                      save to weft
                    </button>
                    <button className="loom-btn-ghost" onClick={() => setRecording(false)}>
                      discard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* right: the silent shuttle */}
          <aside
            style={{
              borderLeft: '1px solid var(--loom-rule)',
              padding: '72px 36px',
              background: 'rgba(244,236,216,0.012)',
              overflowY: 'auto',
            }}
          >
            <div className="loom-eyebrow" style={{ marginBottom: 18 }}>
              delivery
            </div>
            <div className="loom-nameroll" style={{ marginBottom: 36 }}>
              <div className="row">
                <span className="name loom-serif" style={{ fontSize: 16 }}>
                  Maya Hartshorn
                </span>
                <span className="dates">b. 1991</span>
              </div>
              <div className="row warm">
                <span className="name loom-serif" style={{ fontSize: 16 }}>
                  Iris Hartshorn-Vega
                </span>
                <span className="dates">b. 2024</span>
              </div>
              <div className="row">
                <span className="name loom-serif" style={{ fontSize: 16 }}>
                  August Hartshorn
                </span>
                <span className="dates">b. 2018</span>
              </div>
            </div>

            <div className="loom-eyebrow" style={{ marginBottom: 18 }}>
              tied off until
            </div>
            <div
              style={{
                border: '1px solid var(--loom-rule-warm)',
                padding: 18,
                display: 'grid',
                gap: 8,
              }}
            >
              <SealedNote
                date="2055·11·08"
                recipient="when iris turns thirty-one"
                sublabel="your age, the year you wrote it"
              />
            </div>

            <div style={{ marginTop: 28 }}>
              <div className="loom-eyebrow" style={{ marginBottom: 10 }}>
                encryption
              </div>
              <div
                className="loom-mono"
                style={{ fontSize: 10, color: 'var(--loom-bone-dim)', lineHeight: 1.7 }}
              >
                aes-256-gcm · sealed in browser
                <br />
                key escrow · 2 of 3 contacts
                <br />
                cooldown · 48 hours
              </div>
            </div>
          </aside>
        </div>
      </Frame>
    </LoomShell>
  );
}
