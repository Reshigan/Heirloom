import { useEffect, useState, useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}
function useIsMobile() {
  return useSyncExternalStore(subscribe, () => window.innerWidth < 768, () => false);
}
import { Link } from 'react-router-dom';
import { ClothShell } from '../components/ClothShell';
import { SealedNote } from '../components/SealedNote';
import { useAuthStore } from '../../stores/authStore';
import { familyApi, lettersApi, threadsApi } from '../../services/api';

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

interface FamilyMember {
  id: string;
  name: string;
  born?: number;
}

export function Composer() {
  const { user, isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile();

  const [typed, setTyped] = useState('');
  const [showWhisper, setShowWhisper] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const [mode, setMode] = useState<ComposerMode>('paper');
  const [recording, setRecording] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  // Paper mode title
  const [entryTitle, setEntryTitle] = useState('The kitchen window, in late may');

  // Family delivery list
  const [family, setFamily] = useState<FamilyMember[]>([]);

  // Save state (shared between paper + letter modes)
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Typewriter demo effect
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

  // Load real family members when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    familyApi
      .getAll()
      .then((r) => {
        const members: FamilyMember[] = (Array.isArray(r.data) ? r.data : []).map(
          (m: { id: string; name: string; birthDate?: string }) => ({
            id: m.id,
            name: m.name,
            born: m.birthDate ? new Date(m.birthDate).getFullYear() : undefined,
          }),
        );
        setFamily(members);
      })
      .catch(() => {
        // network error — leave family list empty
      });
  }, [isAuthenticated]);

  // Paper mode: save entry to the family thread
  const handleSave = async () => {
    if (!isAuthenticated || !user?.defaultThreadId) return;
    setSaving(true);
    try {
      await threadsApi.createEntry(user.defaultThreadId, {
        title: entryTitle,
        body_ciphertext: typed,
        visibility: 'FAMILY',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('save failed', e);
    } finally {
      setSaving(false);
    }
  };

  // Letter mode: create + seal a letter
  const handleSealLetter = async () => {
    if (!isAuthenticated) return;
    setSaving(true);
    try {
      const res = await lettersApi.create({
        salutation: 'Dear ' + (recipientName || 'you'),
        body: typed,
        signature: user?.firstName ?? '',
        recipientNames: recipientName ? [recipientName] : [],
        scheduledDeliveryDate: unlockDate || undefined,
      });
      await lettersApi.seal(res.data.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('seal letter failed', e);
    } finally {
      setSaving(false);
    }
  };

  // Inline save status line (used in both paper + letter modes)
  const SaveStatus = () => {
    if (saved) {
      return (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--warm)',
            letterSpacing: '0.1em',
          }}
        >
          ∞ woven into the cloth
        </span>
      );
    }
    if (!isAuthenticated) {
      return (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'rgba(244,236,216,0.28)',
            letterSpacing: '0.1em',
          }}
        >
          sign in to save
        </span>
      );
    }
    return null;
  };

  return (
    <ClothShell
      topbarLeft={
        <Link
          to="/loom/weft"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
          }}
        >
          ← cloth
        </Link>
      }
      topbarCenter="compose"
      topbarRight={
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'rgba(244,236,216,0.28)',
            letterSpacing: '0.1em',
          }}
        >
          {saved ? '∞ saved · encrypted' : 'unsaved · encrypted'}
        </span>
      }
    >
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
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
              borderBottom: '1px solid var(--rule)',
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
                  color: mode === m ? 'var(--bone)' : 'var(--bone-faint)',
                  borderBottom:
                    mode === m ? '1px solid var(--warm)' : '1px solid transparent',
                  transition:
                    'color var(--loom-dur-fast) var(--loom-ease), border-color var(--loom-dur-fast) var(--loom-ease)',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* paper mode */}
          {mode === 'paper' && (
            <div
              style={{
                display: 'grid',
                placeItems: 'start center',
                padding: '72px 80px 0',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              <div style={{ width: '100%', maxWidth: 660 }}>
                <div className="loom-eyebrow" style={{ marginBottom: 28, color: 'var(--warm)' }}>
                  ∞ &nbsp; entry · in your own hand
                </div>

                {/* Editable title */}
                <input
                  type="text"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid transparent',
                    outline: 'none',
                    width: '100%',
                    fontFamily: 'var(--serif)',
                    fontVariationSettings: "'opsz' 28",
                    fontSize: 30,
                    fontWeight: 300,
                    fontStyle: 'italic',
                    letterSpacing: '-0.008em',
                    lineHeight: 1.2,
                    color: 'var(--bone)',
                    marginBottom: 18,
                    padding: 0,
                    cursor: 'text',
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderBottomColor = 'var(--rule)')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderBottomColor = 'transparent')
                  }
                />

                <div
                  className="loom-mono"
                  style={{ fontSize: 11, color: 'var(--bone-faint)', marginBottom: 36 }}
                >
                  2026·05·05 · monday · 22:14 · oak street, kitchen
                </div>

                <div
                  className="loom-body"
                  style={{
                    fontSize: 19,
                    lineHeight: 1.85,
                    color: 'var(--bone)',
                    minHeight: 220,
                  }}
                >
                  <span className="hl-composer-cursor-after">{typed}</span>
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

                <div
                  style={{ marginTop: 42, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <button className="loom-btn">tie off · time-lock</button>
                  <button
                    className="loom-btn-ghost"
                    onClick={handleSave}
                    disabled={saving || !typed}
                  >
                    {saving ? 'saving…' : 'save to weft'}
                  </button>
                  <span
                    className="loom-mono"
                    style={{ fontSize: 10, color: 'var(--bone-faint)', marginLeft: 'auto' }}
                  >
                    ⌘ s
                  </span>
                  <SaveStatus />
                </div>
              </div>
            </div>
          )}

          {/* letter mode */}
          {mode === 'letter' && (
            <div
              style={{
                display: 'grid',
                placeItems: 'start center',
                padding: '72px 80px 0',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              <div style={{ width: '100%', maxWidth: 660 }}>
                <div className="loom-eyebrow" style={{ marginBottom: 28, color: 'var(--warm)' }}>
                  ∞ &nbsp; letter · sealed until opened
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label
                      className="loom-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-faint)',
                      }}
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
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-faint)',
                      }}
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
                    color: 'var(--bone)',
                    minHeight: 220,
                  }}
                >
                  <span className="hl-composer-cursor-after">{typed}</span>
                </div>

                <div
                  style={{ marginTop: 42, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <button
                    className="loom-btn"
                    onClick={handleSealLetter}
                    disabled={saving || !typed}
                  >
                    {saving ? 'sealing…' : 'seal letter'}
                  </button>
                  <button className="loom-btn-ghost">save draft</button>
                  <span
                    className="loom-mono"
                    style={{ fontSize: 10, color: 'var(--bone-faint)', marginLeft: 'auto' }}
                  >
                    ⌘ s
                  </span>
                  <SaveStatus />
                </div>
              </div>
            </div>
          )}

          {/* speak mode */}
          {mode === 'speak' && (
            <div
              style={{ display: 'grid', placeItems: 'center', flex: 1, padding: '72px 80px' }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 660,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 40,
                }}
              >
                <div
                  className="loom-eyebrow"
                  style={{ color: 'var(--warm)', alignSelf: 'flex-start' }}
                >
                  ∞ &nbsp; voice memo · spoken word
                </div>

                <button
                  type="button"
                  onClick={() => setRecording((r) => !r)}
                  style={{
                    background: 'transparent',
                    border: recording ? '1px solid var(--warm)' : '1px solid var(--rule)',
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
                      color: recording ? 'var(--warm)' : 'var(--bone-dim)',
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
                    color: 'var(--bone-dim)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  }}
                >
                  {recording ? '● recording' : '○ tap to speak'}
                </span>

                {recording && (
                  <div
                    className="loom-mono"
                    style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.15em' }}
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

        {/* right: the silent shuttle — hidden on mobile, full sidebar on desktop */}
        {!isMobile && <aside
          style={{
            borderLeft: '1px solid var(--rule)',
            padding: '72px 36px',
            overflowY: 'auto',
          }}
        >
          <div className="loom-eyebrow" style={{ marginBottom: 18 }}>
            delivery
          </div>
          <div className="loom-nameroll" style={{ marginBottom: 36 }}>
            {family.length === 0 ? (
              <div style={{
                fontFamily: 'var(--serif)',
                fontSize: 13,
                fontStyle: 'italic',
                color: 'var(--bone-faint)',
                lineHeight: 1.6,
              }}>
                no family members yet.{' '}
                <Link to="/family" style={{ color: 'var(--warm)', textDecoration: 'none' }}>
                  invite someone →
                </Link>
              </div>
            ) : (
              family.map((member, idx) => (
                <div key={member.id} className={idx === 1 ? 'row warm' : 'row'}>
                  <span className="name loom-serif" style={{ fontSize: 16 }}>
                    {member.name}
                  </span>
                  {member.born != null && (
                    <span className="dates">b. {member.born}</span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="loom-eyebrow" style={{ marginBottom: 18 }}>
            tied off until
          </div>
          <div
            style={{
              border: '1px solid var(--rule-warm)',
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
              style={{ fontSize: 10, color: 'var(--bone-dim)', lineHeight: 1.7 }}
            >
              aes-256-gcm · sealed in browser
              <br />
              key escrow · 2 of 3 contacts
              <br />
              cooldown · 48 hours
            </div>
          </div>
        </aside>}
      </div>
    </ClothShell>
  );
}
