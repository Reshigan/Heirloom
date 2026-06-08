import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { lettersApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

/**
 * Screen 05 — The Unlock
 *
 * The product's ONLY ceremony, and it is made of type, not theatre.
 * STITCH_BRIEF §1.5-D / §2.5: when a tied-off thread reaches its date the
 * transformation is a single 720ms typographic cross-fade — the ∞ and the
 * sealed-date dissolve as the entry's title and prose fade up in warm. Nothing
 * burns, melts, sparks, or glows. §2.6 forbids the fire/wax/key/vault family of
 * literal-metaphor objects, glassmorphism, gradient meshes, drop shadows, and
 * floating cards that translate on entry.
 *
 *   phase 0  sealed     — ∞ + the sealed dates, at rest
 *   phase 1  dissolve    — the 720ms cross-fade (∞/date out, letter in)
 *   phase 2  the letter  — the prose, readable
 *   phase 3  the artifact— a portrait card to pass to descendants
 *
 * The letter is the signed-in author's own — the most recent sealed letter
 * whose delivery date has arrived. No mock content: when nothing has untied
 * yet, the EmptyUnlock prompt holds the screen.
 */
const VEIL = 'opacity var(--loom-dur-veil) var(--loom-ease)';

interface UnlockLetter {
  recipient: string;
  salutation: string;
  body: string;
  signature: string;
  writtenDate: string;   // formatted, when the letter was written
  sealedDate: string;    // formatted, when it was tied off
  openedDate: string;    // formatted, when it untied
  years: number;         // whole years between sealed and opened
}

const fmtDate = (iso?: string | null): string =>
  iso ? new Date(iso).toISOString().slice(0, 10).replace(/-/g, '·') : '';

function wholeYears(fromIso?: string | null, toIso?: string | null): number {
  if (!fromIso || !toIso) return 0;
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.max(0, Math.round(ms / (365.25 * 24 * 3600 * 1000)));
}

export function Unlock() {
  const { isAuthenticated, user } = useAuthStore();
  const [letter, setLetter] = useState<UnlockLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const [continueVisible, setContinueVisible] = useState(false);
  const [continueClicked, setContinueClicked] = useState(false);

  const authorName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim(),
    [user],
  );

  // Load the author's most recently untied sealed letter (real data only).
  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await lettersApi.getAll({ status: 'sealed', limit: 100 });
        const rows: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const now = Date.now();
        // "Untied" = sealed, has a delivery date, and that date has arrived.
        const matured = rows
          .filter((l) => l.sealedAt && l.scheduledDate && new Date(l.scheduledDate).getTime() <= now)
          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
        const head = matured[0];
        if (!head) { if (!cancelled) setLoading(false); return; }

        // Pull the full body (the list only carries a preview).
        const full = (await lettersApi.getOne(head.id)).data;
        if (cancelled) return;
        const recipient =
          full.recipients?.[0]?.name ||
          head.recipients?.[0]?.name ||
          (full.salutation || '').replace(/^(dear|to)\s+/i, '').replace(/[,，]\s*$/, '') ||
          'someone';
        setLetter({
          recipient,
          salutation: full.salutation || `${recipient},`,
          body: (full.body || '').trim(),
          signature: full.signature || authorName || '',
          writtenDate: fmtDate(full.createdAt || head.createdAt),
          sealedDate: fmtDate(full.sealedAt || head.sealedAt),
          openedDate: fmtDate(full.scheduledDate || head.scheduledDate),
          years: wholeYears(full.sealedAt || head.sealedAt, full.scheduledDate || head.scheduledDate),
        });
      } catch {
        // Network/auth failure → empty state, never fabricated content.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, authorName]);

  // The reveal cadence only runs once we actually have a letter to unseal.
  useEffect(() => {
    if (!letter || paused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setPhase(0);
    setContinueVisible(false);
    setContinueClicked(false);
    timers.push(setTimeout(() => setPhase(1), 2200)); // the dissolve begins
    timers.push(setTimeout(() => setPhase(2), 2920)); // 720ms later: letter settled
    // Show "continue →" button after letter has been visible for 2s
    timers.push(setTimeout(() => setContinueVisible(true), 4920));
    return () => timers.forEach(clearTimeout);
  }, [letter, paused]);

  // Advance to artifact when user clicks continue
  useEffect(() => {
    if (continueClicked) setPhase(3);
  }, [continueClicked]);

  // ── No matured letter (or not signed in / still loading) → honest empty state ──
  if (!letter) {
    return (
      <ClothShell topbarCenter="sealed" backdropOpacity={0.5}>
        <EmptyUnlock loading={loading} authed={isAuthenticated} />
      </ClothShell>
    );
  }

  return (
    <ClothShell
      topbarCenter="sealed"
      topbarRight={
        <span
          className="loom-mono loom-faint"
          style={{ display: 'flex', gap: 14, alignItems: 'center' }}
        >
          <span aria-hidden style={{ width: 5, height: 5, background: 'var(--warm)' }} />
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
      backdropOpacity={0.5}
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
              tied off {letter.sealedDate} &nbsp;·&nbsp; untied {letter.openedDate} &nbsp;·&nbsp; for {letter.recipient}
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
                    sealed · {letter.years === 1 ? 'one year' : `${letter.years} years`}
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
                <div style={{ maxWidth: 560, textAlign: 'left', maxHeight: 360, overflowY: 'auto' }}>
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
                    written {letter.writtenDate}
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
                    {letter.salutation}
                  </div>
                  <div
                    className="loom-body"
                    style={{
                      fontSize: 17,
                      color: 'var(--bone)',
                      lineHeight: 1.85,
                      textWrap: 'pretty',
                      fontVariationSettings: "'opsz' 14",
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {letter.body}
                  </div>
                  {letter.signature && (
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
                      — {letter.signature}
                    </div>
                  )}
                  {continueVisible && !continueClicked && (
                    <div style={{ marginTop: 28, textAlign: 'right' }}>
                      <button
                        onClick={() => setContinueClicked(true)}
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 10,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--warm)',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid var(--rule)',
                          cursor: 'pointer',
                          paddingBottom: 2,
                          opacity: 1,
                          transition: `opacity 360ms var(--loom-ease)`,
                        }}
                      >
                        continue →
                      </button>
                    </div>
                  )}
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
                <ShareCard letter={letter} />
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
    </ClothShell>
  );
}

/* ─── No thread has untied yet ─────────────────────────────────────────── */
function EmptyUnlock({ loading, authed }: { loading: boolean; authed: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        padding: '0 24px',
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <div
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontVariationSettings: "'opsz' 72",
            fontSize: 88,
            fontWeight: 300,
            lineHeight: 1,
            color: 'var(--warm)',
            marginBottom: 28,
          }}
        >
          ∞
        </div>
        {loading ? (
          <div className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            reading the loom…
          </div>
        ) : (
          <>
            <div
              className="loom-serif"
              style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 300, color: 'var(--bone)', lineHeight: 1.6 }}
            >
              No thread has untied yet.
            </div>
            <div
              className="loom-body loom-dim"
              style={{ fontSize: 15, marginTop: 14, lineHeight: 1.7 }}
            >
              When a sealed letter reaches its date, the loom unties it here — its
              prose fading up exactly when you meant it to arrive.
            </div>
            <div className="loom-eyebrow" style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 22 }}>
              <Link to="/compose" className="loom-btn" style={{ textDecoration: 'none' }}>
                seal a letter
              </Link>
              {authed && (
                <Link to="/loom/tied" className="loom-btn-ghost" style={{ textDecoration: 'none' }}>
                  see what's waiting
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── The artifact — a portrait card to pass on. Type on ink, one hairline,
   one warm accent. No gradients, no glow, no shadow (§2.6). ───────────────── */
function ShareCard({ letter }: { letter: UnlockLetter }) {
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
            {letter.years}
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
            {letter.years === 1 ? 'year' : 'years'} between
            <br />
            <span className="loom-warm-text">when it was sealed</span>
            <br />
            and
            <br />
            <span className="loom-warm-text">when it was read</span>
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
              <span style={{ color: 'var(--warm)' }}>·</span> sealed {letter.sealedDate}
            </div>
            <div>
              <span style={{ color: 'var(--warm)' }}>·</span> opened {letter.openedDate}
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
            written for
            <br />
            {letter.recipient}.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          borderTop: '1px solid var(--rule)',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
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
            ∞
          </span>
        </div>
        <button
          onClick={async () => {
            const text = `${letter.years} years from when it was written. A letter from ${letter.sealedDate} opened on ${letter.openedDate}.`;
            if (navigator.share) {
              await navigator.share({ text, title: 'Heirloom' }).catch(() => {});
            } else {
              await navigator.clipboard.writeText(text).catch(() => {});
            }
          }}
          style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', background: 'none', border: 'none', borderBottom: '1px solid var(--rule)', cursor: 'pointer', marginTop: 24, paddingBottom: 2 }}
        >
          share this moment →
        </button>
      </div>
    </div>
  );
}
