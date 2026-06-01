/**
 * Onboarding Wizard — Loom 3
 *
 * Three-column, single-screen ceremony. Left column picks your door
 * (how you'll use Heirloom). Center column captures a voice fragment.
 * Right column shows the first thread woven and invites the user into
 * the cloth.
 *
 * Preserves: state, API calls (settingsApi.completeOnboarding), navigation.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';
import { settingsApi } from '../services/api';

// ── Door options (Step 1) ────────────────────────────────────────────────────
const DOORS = [
  {
    name: 'preserve',
    description: 'Capture memories, letters, and voice notes before they are lost.',
  },
  {
    name: 'letter',
    description: 'Write sealed letters to open on a future date or after you are gone.',
  },
  {
    name: 'connect',
    description: 'Weave your thread into a shared cloth with family across generations.',
  },
  {
    name: 'archive',
    description: 'Build an annotated record — dates, places, documents, oral history.',
  },
] as const;

type DoorKey = (typeof DOORS)[number]['name'];

// ── Voice timer helper ────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function OnboardingWizardPage() {
  const navigate = useNavigate();

  // Step state: 1 = door, 2 = voice, 3 = cloth
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<DoorKey | null>(null);

  // Voice ring state
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [voiceDone, setVoiceDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Thread reveal state
  const [threadRevealed, setThreadRevealed] = useState(false);

  // Start timer when recording
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

  // Reveal thread when step 3 mounts
  useEffect(() => {
    if (step === 3) {
      const t = setTimeout(() => setThreadRevealed(true), 300);
      return () => clearTimeout(t);
    }
  }, [step]);

  // ── API + navigation helpers ──────────────────────────────────────────────
  const finishOnboarding = async () => {
    try {
      await settingsApi.completeOnboarding();
    } catch (e) {
      console.error('Failed to save onboarding status:', e);
    }
    navigate('/loom');
  };

  const handleSkip = async () => {
    try {
      await settingsApi.completeOnboarding();
    } catch (e) {
      console.error('Failed to save onboarding status:', e);
    }
    navigate('/loom');
  };

  // ── Step advancement ──────────────────────────────────────────────────────
  const advanceFromStep1 = () => {
    if (selected) setStep(2);
  };

  const stopRecording = () => {
    setRecording(false);
    setVoiceDone(true);
    setTimeout(() => setStep(3), 360);
  };

  const skipVoice = () => {
    setRecording(false);
    setVoiceDone(false);
    setStep(3);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="hl-screen"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--ink)',
        color: 'var(--bone)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div className="hl-topbar">
        {/* Left: logo wordmark */}
        <HLogo size={18} wordmark />

        {/* Center: counter slot */}
        <div
          className="hl-counter"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          welcome · this takes about 90 seconds
        </div>

        {/* Right: skip */}
        <button
          type="button"
          onClick={handleSkip}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-dim)',
            transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
        >
          skip and explore →
        </button>
      </div>

      {/* Three-column body */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          bottom: 36,
          left: 0,
          right: 0,
          display: 'flex',
        }}
      >
        {/* ── Column 1: Door ─────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--rule)',
          }}
        >
          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 22,
            }}
          >
            step 1 of 3
          </div>

          <h2
            className="hl-serif"
            style={{
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: '-0.012em',
              margin: '0 0 8px',
              color: 'var(--bone)',
            }}
          >
            Choose your door.
          </h2>

          <p
            className="hl-serif"
            style={{
              fontSize: 14.5,
              color: 'var(--bone-dim)',
              margin: '0 0 22px',
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            How do you want to begin? You can always come back and use all of these.
          </p>

          {/* Door list */}
          <div style={{ flex: 1 }}>
            {DOORS.map((door) => {
              const isSelected = selected === door.name;
              return (
                <button
                  key={door.name}
                  type="button"
                  onClick={() => setSelected(door.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    width: '100%',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid var(--rule)',
                    padding: '14px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <span
                    className="hl-mono"
                    style={{
                      fontSize: 9.5,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-faint)',
                      width: 110,
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    {door.name}
                  </span>
                  <span
                    className="hl-serif"
                    style={{
                      fontSize: 15,
                      color: isSelected ? 'var(--bone)' : 'var(--bone-dim)',
                      fontWeight: 300,
                      lineHeight: 1.5,
                      flex: 1,
                      transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    {door.description}
                  </span>
                  {isSelected && (
                    <span
                      className="hl-mono"
                      style={{
                        fontSize: 10,
                        color: 'var(--warm)',
                        letterSpacing: '0.1em',
                        flexShrink: 0,
                        paddingTop: 2,
                      }}
                    >
                      chosen ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Next CTA — only visible once a door is selected */}
          {selected && (
            <div style={{ marginTop: 22 }}>
              <button
                type="button"
                className="hl-btn"
                onClick={advanceFromStep1}
                style={{ fontSize: 13 }}
              >
                continue →
              </button>
            </div>
          )}
        </div>

        {/* ── Column 2: Voice ring ───────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--rule)',
            opacity: step >= 2 ? 1 : 0.25,
            transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: step >= 2 ? 'auto' : 'none',
          }}
        >
          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 22,
            }}
          >
            step 2 of 3
          </div>

          <h2
            className="hl-serif"
            style={{
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: '-0.012em',
              margin: '0 0 8px',
              color: 'var(--bone)',
            }}
          >
            Speak a fragment.
          </h2>

          <p
            className="hl-serif"
            style={{
              fontSize: 14.5,
              color: 'var(--bone-dim)',
              margin: '0 0 22px',
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            Say anything — a name, a memory, a sentence you've never written down.
          </p>

          {/* Centered voice ring */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 200,
                height: 200,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              {/* Outer ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '1px solid var(--bone-dim)',
                  borderRadius: '50%',
                  transition: 'border-color 360ms cubic-bezier(0.16,1,0.3,1)',
                  ...(recording
                    ? { borderColor: 'var(--warm)', opacity: 0.5 }
                    : {}),
                }}
              />
              {/* Middle ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 18,
                  border: '1px solid var(--bone-low)',
                  borderRadius: '50%',
                }}
              />
              {/* Inner ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 36,
                  border: '1px solid var(--bone-faint)',
                  borderRadius: '50%',
                  opacity: 0.5,
                }}
              />

              {/* Timer / tap to record */}
              {recording || voiceDone ? (
                <span
                  className="hl-mono"
                  style={{
                    fontSize: 30,
                    color: voiceDone ? 'var(--warm)' : 'var(--bone)',
                    letterSpacing: '0.06em',
                    zIndex: 1,
                  }}
                >
                  {formatTime(elapsed)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setRecording(true)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    zIndex: 1,
                    transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
                >
                  tap to record
                </button>
              )}
            </div>

            {/* Stop / skip controls */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              {recording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                  }}
                >
                  stop
                </button>
              )}
              {!voiceDone && (
                <button
                  type="button"
                  onClick={skipVoice}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--bone-faint)',
                    transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-faint)')}
                >
                  skip
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Column 3: Cloth ───────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            opacity: step >= 3 ? 1 : 0.25,
            transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: step >= 3 ? 'auto' : 'none',
          }}
        >
          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 22,
            }}
          >
            step 3 of 3
          </div>

          <h2
            className="hl-serif"
            style={{
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: '-0.012em',
              margin: '0 0 8px',
              color: 'var(--bone)',
            }}
          >
            Your thread is in the cloth.
          </h2>

          <p
            className="hl-serif"
            style={{
              fontSize: 14.5,
              color: 'var(--bone-dim)',
              margin: '0 0 22px',
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            Every entry you make becomes one more pick woven into a cloth that
            will outlast you.
          </p>

          {/* Cloth placeholder */}
          <div
            style={{
              background: '#0a0a08',
              padding: 14,
              height: 160,
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* Weft lines simulating a cloth fragment */}
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 14 + i * 20,
                  height: 1,
                  background: `rgba(244,236,216,${0.04 + i * 0.01})`,
                  opacity: threadRevealed ? 1 : 0,
                  transform: threadRevealed ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left center',
                  transition: `opacity 720ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms, transform 720ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
                }}
              />
            ))}
            {/* Warm marker thread */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 14 + 3 * 20,
                height: 1,
                background: 'var(--warm)',
                opacity: threadRevealed ? 0.7 : 0,
                transform: threadRevealed ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left center',
                transition: 'opacity 720ms cubic-bezier(0.16,1,0.3,1) 480ms, transform 720ms cubic-bezier(0.16,1,0.3,1) 480ms',
              }}
            />
          </div>

          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.14em',
              marginTop: 14,
            }}
          >
            your first thread · woven just now
          </div>

          <div style={{ marginTop: 22 }}>
            <button
              type="button"
              className="hl-btn"
              onClick={finishOnboarding}
              style={{ fontSize: 13 }}
            >
              Enter the cloth →
            </button>
          </div>
        </div>
      </div>

      {/* TapestryEdge */}
      <TapestryEdge nowFrac={0.06} />
    </div>
  );
}

export default OnboardingWizardPage;
