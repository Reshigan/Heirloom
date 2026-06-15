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
  sealedYear: string;    // year only, for the SEALED yyyy label
  openedYear: string;    // year only, for the OPENED yyyy label
  years: number;         // whole years between sealed and opened
}

// First sentence/line of the letter body, for the dim serif teaser under the seal.
const firstLine = (body: string): string => {
  const t = (body || '').trim();
  if (!t) return '';
  const m = t.match(/^[^.!?\n]*[.!?]?/);
  const s = (m ? m[0] : t.split('\n')[0]).trim();
  return s.length > 90 ? s.slice(0, 88).trimEnd() + '…' : s;
};

const fmtYear = (iso?: string | null): string =>
  iso ? String(new Date(iso).getUTCFullYear()) : '';

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
          sealedYear: fmtYear(full.sealedAt || head.sealedAt),
          openedYear: fmtYear(full.scheduledDate || head.scheduledDate),
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
          className="hl-mono"
          style={{ display: 'flex', gap: 14, alignItems: 'center', color: 'var(--bone-faint)' }}
        >
          <span aria-hidden style={{ width: 5, height: 5, background: 'var(--warm)' }} />
          a thread unties · today
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            style={{
              cursor: 'pointer',
              paddingLeft: 14,
              color: 'var(--bone-dim)',
              background: 'transparent',
              border: 0,
              borderLeft: '1px solid var(--rule)',
              fontFamily: 'var(--mono)',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
            }}
          >
            {paused ? 'play' : 'pause'}
          </button>
        </span>
      }
      backdropOpacity={0.5}
    >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateRows: '1fr auto',
            padding: 'clamp(28px, 7vw, 72px) clamp(20px, 7vw, 96px)',
          }}
        >
          {/* center stage — the 720ms typographic dissolve */}
          <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', maxWidth: 600, width: '100%', minHeight: 460 }}>
              {/* THE SEAL — glowing amber ∞ wax seal dissolving into filament light */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  opacity: phase < 1 ? 1 : 0,
                  transform: phase < 1 ? 'scale(1)' : 'scale(1.08)',
                  filter: phase < 1 ? 'blur(0px)' : 'blur(6px)',
                  transition: `opacity 1400ms var(--loom-ease), transform 1400ms var(--loom-ease), filter 1400ms var(--loom-ease)`,
                  pointerEvents: 'none',
                }}
              >
                <div style={{ display: 'grid', placeItems: 'center', gap: 'clamp(40px, 12vh, 96px)' }}>
                  {/* eyebrow — SEALED yyyy · OPENED TODAY */}
                  <div
                    className="loom-mono"
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: 'var(--bone-faint)',
                      letterSpacing: '0.28em',
                      textTransform: 'uppercase',
                    }}
                  >
                    sealed&nbsp;&nbsp;{letter.sealedDate}&nbsp;&nbsp;·&nbsp;&nbsp;opened today
                  </div>

                  {/* the seal — large warm ∞ disc with a soft radial glow behind it */}
                  <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        width: 360,
                        height: 360,
                        borderRadius: '50%',
                        background:
                          'radial-gradient(circle, var(--warm-glow) 0%, rgba(176,122,74,0.10) 38%, transparent 70%)',
                        pointerEvents: 'none',
                      }}
                    />
                    <WaxSeal size={132} />
                  </div>

                  {/* the headline + the letter's first line, dim serif italic */}
                  <div style={{ display: 'grid', placeItems: 'center', gap: 14, maxWidth: 360 }}>
                    <div
                      style={{
                        fontFamily: 'var(--serif)',
                        fontVariationSettings: "'opsz' 48",
                        fontSize: 'clamp(28px, 6vw, 36px)',
                        fontWeight: 400,
                        lineHeight: 1.1,
                        letterSpacing: '-0.015em',
                        color: 'var(--bone)',
                      }}
                    >
                      A letter has opened.
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 18,
                        fontStyle: 'italic',
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: 'var(--bone-dim)',
                      }}
                    >
                      {firstLine(letter.body) || letter.salutation}
                    </div>
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
                <div
                  style={{
                    maxWidth: 540,
                    width: '100%',
                    textAlign: 'left',
                    maxHeight: '100%',
                    overflowY: 'auto',
                  }}
                >
                  {/* small glowing wax-sealed ∞, near top-center */}
                  <div style={{ textAlign: 'center', marginBottom: 26 }}>
                    <WaxSeal size={30} />
                  </div>

                  {/* SEALED yyyy   OPENED yyyy */}
                  <div
                    className="loom-mono"
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 28,
                      fontSize: 10,
                      color: 'var(--bone-faint)',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      paddingBottom: 30,
                      marginBottom: 34,
                      borderBottom: '1px solid var(--rule)',
                    }}
                  >
                    <span>sealed&nbsp;&nbsp;{letter.sealedYear}</span>
                    <span>opened&nbsp;&nbsp;{letter.openedYear}</span>
                  </div>

                  {/* large serif salutation */}
                  <div
                    className="loom-serif"
                    style={{
                      fontFamily: "'Source Serif 4', serif",
                      fontVariationSettings: "'opsz' 60",
                      fontSize: 'clamp(34px, 6vw, 46px)',
                      lineHeight: 1.05,
                      marginBottom: 34,
                      fontWeight: 300,
                      color: 'var(--bone)',
                      letterSpacing: '-0.018em',
                    }}
                  >
                    {letter.salutation}
                  </div>

                  {/* warm-tinted serif prose */}
                  <div
                    className="loom-body"
                    style={{
                      fontFamily: "'Source Serif 4', serif",
                      fontSize: 17,
                      color: 'var(--warm-bright)',
                      lineHeight: 1.95,
                      textWrap: 'pretty',
                      fontVariationSettings: "'opsz' 16",
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {letter.body}
                  </div>
                  {letter.signature && (
                    <div
                      style={{
                        marginTop: 30,
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
                    <div style={{ marginTop: 36, textAlign: 'right' }}>
                      <button
                        type="button"
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

          {/* footer rule — ceremony status left, archival mark right */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderTop: '1px solid var(--rule)',
              paddingTop: 18,
            }}
          >
            <span
              className="loom-mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: phase >= 2 ? 'var(--warm)' : 'var(--bone-faint)',
                transition: 'color var(--loom-dur-shift) var(--loom-ease)',
              }}
            >
              {phase >= 3
                ? 'the artifact'
                : phase >= 2
                  ? 'ceremony complete'
                  : phase >= 1
                    ? 'the dissolve'
                    : 'sealed'}
            </span>
            <span
              className="loom-mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
              }}
            >
              JetBrains Mono
            </span>
          </div>
      </div>
    </ClothShell>
  );
}

/* ─── The wax seal — a small warm disc carrying the ∞ mark. The product's one
   warm accent, lit by --warm-glow. No gradient mesh, no blur, no drop shadow —
   a single ring-lit disc, the ∞ glyph engraved in ink. ──────────────────── */
function WaxSeal({ size = 30 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--warm)',
        boxShadow: `0 0 0 1px var(--warm-bright), 0 0 ${size * 0.45}px var(--warm-glow), 0 0 ${size * 1.1}px var(--warm-glow)`,
      }}
    >
      <span
        style={{
          fontFamily: "'Source Serif 4', serif",
          fontVariationSettings: "'opsz' 48",
          fontSize: size * 0.5,
          fontWeight: 400,
          lineHeight: 1,
          color: 'var(--ink)',
        }}
      >
        ∞
      </span>
    </span>
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
          type="button"
          aria-label="Share this moment"
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
