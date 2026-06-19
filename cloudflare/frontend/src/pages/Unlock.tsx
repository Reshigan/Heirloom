import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { lettersApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { copyToClipboard } from '../utils/clipboard';

/**
 * Screen 05 — The Unlock
 *
 * The product's ONLY ceremony, and it is made of type, not theatre. A single
 * sealed letter holds the centre of a vast, empty stage: a glowing warm ∞, the
 * letter's title in serif, a mono line of dates, and — when the letter is the
 * author's own and its day has come — one warm "BREAK THE SEAL →" affordance.
 *
 *   phase 0  sealed     — ∞ + the title + dates, at rest. If the date has not
 *                         yet arrived this is the whole screen (no button).
 *   phase 1  dissolve   — the 720ms cross-fade (∞/title out, letter in)
 *   phase 2  the letter — the prose, readable
 *   phase 3  the artifact — a portrait card to pass to descendants
 *
 * Nothing burns, melts, sparks, or glows: the ∞ rests as plain warm type, no
 * halo. The fire/wax/key/vault family of literal-metaphor objects, glassmorphism,
 * gradient meshes, drop shadows, and floating cards are all forbidden.
 *
 * The letter is the signed-in author's own: we surface the next one in the
 * bloodline, preferring the most-recently-matured (openable) sealed letter and
 * falling back to the soonest-upcoming one so the waiting state is honest. No
 * mock content — when nothing is sealed at all, the EmptyUnlock prompt holds
 * the screen.
 */
const VEIL = 'opacity var(--loom-dur-veil) var(--loom-ease)';

interface UnlockLetter {
  title: string;
  recipient: string;
  salutation: string;
  body: string;
  signature: string;
  writtenDate: string;   // formatted, when the letter was written
  sealedDate: string;    // formatted, when it was tied off
  sealedStamp: string;   // "14 JAN 1999" — the eyebrow's date stamp
  openedDate: string;    // formatted, when it untied / is due to
  writtenYear: string;   // year only, when it was written (byline)
  sealedYear: string;    // year only, for the SEALED yyyy label
  openedYear: string;    // year only, for the OPENS/OPENED yyyy label
  years: number;         // whole years between sealed and opened
  openable: boolean;     // the delivery date has arrived — the seal may break
}

const fmtYear = (iso?: string | null): string =>
  iso ? String(new Date(iso).getUTCFullYear()) : '';

const fmtDate = (iso?: string | null): string =>
  iso ? new Date(iso).toISOString().slice(0, 10).replace(/-/g, '·') : '';

// "14 JAN 1999" — the eyebrow's archival date stamp.
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const fmtStamp = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

// The letter's opening line — its first sentence, set in italic serif under the
// headline. Falls back to the salutation when the body is empty.
function openingLine(salutation: string, body: string): string {
  const first = (body || '').trim().split(/\n+/)[0]?.trim() ?? '';
  if (!first) return salutation;
  const sentence = first.split(/(?<=[.!?…])\s/)[0]?.trim() ?? first;
  const clipped = sentence.length > 96 ? `${sentence.slice(0, 95).trim()}…` : sentence;
  return clipped.replace(/[.…]+$/, '') + '…';
}

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
  const [broken, setBroken] = useState(false);     // the seal has been broken (reveal armed)
  const [paused, setPaused] = useState(false);
  const [continueVisible, setContinueVisible] = useState(false);
  const [continueClicked, setContinueClicked] = useState(false);

  const authorName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim(),
    [user],
  );

  // Load the next sealed letter in the bloodline (real data only): prefer the
  // most-recently-matured one whose delivery date has arrived; otherwise fall
  // back to the soonest-upcoming sealed letter so the waiting state is honest.
  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await lettersApi.getAll({ status: 'sealed', limit: 100 });
        const rows: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const now = Date.now();
        const sealed = rows.filter((l) => l.sealedAt && l.scheduledDate);
        // "Untied" = sealed, has a delivery date, and that date has arrived.
        const matured = sealed
          .filter((l) => new Date(l.scheduledDate).getTime() <= now)
          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
        // Still waiting — the soonest one whose day is yet to come.
        const upcoming = sealed
          .filter((l) => new Date(l.scheduledDate).getTime() > now)
          .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
        const head = matured[0] ?? upcoming[0];
        if (!head) { if (!cancelled) setLoading(false); return; }

        const openable = new Date(head.scheduledDate).getTime() <= now;

        // Pull the full body (the list only carries a preview).
        const full = (await lettersApi.getOne(head.id)).data;
        if (cancelled) return;
        const recipient =
          full.recipients?.[0]?.name ||
          head.recipients?.[0]?.name ||
          (full.salutation || '').replace(/^(dear|to)\s+/i, '').replace(/[,，]\s*$/, '') ||
          'someone';
        const salutation = full.salutation || `${recipient},`;
        const writtenIso = full.createdAt || head.createdAt;
        setLetter({
          title:
            full.title ||
            head.title ||
            (full.salutation || '').replace(/[,，]\s*$/, '') ||
            'A sealed letter',
          recipient,
          salutation,
          body: (full.body || '').trim(),
          signature: full.signature || authorName || '',
          writtenDate: fmtDate(writtenIso),
          sealedDate: fmtDate(full.sealedAt || head.sealedAt),
          sealedStamp: fmtStamp(full.sealedAt || head.sealedAt),
          openedDate: fmtDate(full.scheduledDate || head.scheduledDate),
          writtenYear: fmtYear(writtenIso),
          sealedYear: fmtYear(full.sealedAt || head.sealedAt),
          openedYear: fmtYear(full.scheduledDate || head.scheduledDate),
          years: wholeYears(full.sealedAt || head.sealedAt, full.scheduledDate || head.scheduledDate),
          openable,
        });
      } catch {
        // Network/auth failure → empty state, never fabricated content.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, authorName]);

  // The reveal cadence only runs once the seal has actually been broken — an
  // openable letter waits at rest on phase 0 until the viewer breaks it.
  useEffect(() => {
    if (!letter || !broken || paused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setPhase(0);
    setContinueVisible(false);
    setContinueClicked(false);
    timers.push(setTimeout(() => setPhase(1), 720));  // the dissolve begins
    timers.push(setTimeout(() => setPhase(2), 1440)); // 720ms later: letter settled
    // Show "continue →" button after letter has been visible for ~2s
    timers.push(setTimeout(() => setContinueVisible(true), 3440));
    return () => timers.forEach(clearTimeout);
  }, [letter, broken, paused]);

  // Advance to artifact when user clicks continue
  useEffect(() => {
    if (continueClicked) setPhase(3);
  }, [continueClicked]);

  // ── No sealed letter at all (or not signed in / still loading) → honest empty state ──
  if (!letter) {
    return (
      <ClothShell topbarCenter="sealed" backdropOpacity={0.5}>
        <EmptyUnlock loading={loading} authed={isAuthenticated} />
      </ClothShell>
    );
  }

  const sealedRest = phase < 1; // the ceremony card, at rest, before any dissolve

  return (
    <ClothShell
      topbarCenter="sealed"
      topbarRight={
        <span
          className="hl-mono"
          style={{ display: 'flex', gap: 14, alignItems: 'center', color: 'var(--bone-faint)' }}
        >
          <span
            aria-hidden
            style={{
              width: 5,
              height: 5,
              background: 'none',
              border: '1px solid var(--warm)',
              borderRadius: 0,
            }}
          />
          {letter.openable ? 'a thread unties · today' : `sealed · opens ${letter.openedYear}`}
          {broken && (
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
          )}
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
              {/* THE OPENING — mono eyebrow stamp at top, the wax-knot breaking
                  into embers carried by the global backdrop, then the centred
                  headline + the letter's opening line in italic serif. */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  gridTemplateRows: 'auto 1fr',
                  textAlign: 'center',
                  background: 'radial-gradient(120% 60% at 50% 40%, var(--vignette-core), var(--vignette-edge) 72%)',
                  opacity: sealedRest ? 1 : 0,
                  transform: sealedRest ? 'scale(1)' : 'scale(1.08)',
                  transition: `opacity 1400ms var(--loom-ease), transform 1400ms var(--loom-ease)`,
                  pointerEvents: sealedRest ? 'auto' : 'none',
                }}
              >
                {/* woven embers — behind the opening content, decorative only */}
                <picture style={{ display: 'contents' }}>
                  <source type="image/avif" srcSet="/woven/unseal.avif" />
                  <source type="image/webp" srcSet="/woven/unseal.webp" />
                  <img
                    src="/woven/unseal.png"
                    alt=""
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 'clamp(150px, 32vw, 200px)',
                      height: 'auto',
                      opacity: 0.16,
                      pointerEvents: 'none',
                      zIndex: 0,
                    }}
                  />
                </picture>

                {/* mono eyebrow — SEALED <date> · OPENED TODAY / OPENS yyyy */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'var(--muted-2)',
                    textAlign: 'center',
                  }}
                >
                  {[
                    letter.sealedStamp ? `sealed ${letter.sealedStamp}` : 'sealed',
                    letter.openable ? 'opened today' : `opens ${letter.openedYear}`,
                  ].join(' · ')}
                </div>

                {/* the headline + opening line, centred in the remaining air */}
                <div style={{ display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ maxWidth: 460, width: '100%' }}>
                    <h1
                      className="hl-serif"
                      style={{
                        margin: 0,
                        fontFamily: 'var(--serif)',
                        fontSize: 'clamp(30px, 6vw, 44px)',
                        fontWeight: 380,
                        lineHeight: 1.08,
                        letterSpacing: '-0.018em',
                        color: 'var(--bone)',
                      }}
                    >
                      {letter.openable ? 'A letter has opened.' : letter.title}
                    </h1>

                    <p
                      style={{
                        margin: '22px 0 0',
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontWeight: 300,
                        fontSize: 'clamp(16px, 3.4vw, 19px)',
                        lineHeight: 1.55,
                        color: 'var(--text-excerpt)',
                        textWrap: 'balance',
                      }}
                    >
                      {letter.openable
                        ? openingLine(letter.salutation, letter.body)
                        : `Written by ${letter.signature || 'an unknown hand'}${letter.writtenYear ? `, ${letter.writtenYear}` : ''}.`}
                    </p>

                    {/* primary action — only when the seal may break */}
                    {letter.openable && (
                      <button
                        type="button"
                        onClick={() => setBroken(true)}
                        style={{
                          marginTop: 40,
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          letterSpacing: '0.26em',
                          textTransform: 'uppercase',
                          color: 'var(--warm)',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid var(--rule-warm)',
                          cursor: 'pointer',
                          paddingBottom: 4,
                          transition: `color 360ms var(--loom-ease)`,
                        }}
                      >
                        read the letter →
                      </button>
                    )}
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
                    <WaxSeal size={26} />
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
                      fontFamily: 'var(--serif-display)',
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
                      fontFamily: 'var(--serif)',
                      fontSize: 17,
                      color: 'var(--warm-bright)',
                      lineHeight: 1.95,
                      textWrap: 'pretty',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {letter.body}
                  </div>
                  {letter.signature && (
                    <div
                      style={{
                        marginTop: 30,
                        fontFamily: 'var(--serif)',
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

          {/* footer rule — ceremony status left; shown only once the dissolve begins */}
          {!sealedRest && (
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
                      : letter.openable
                        ? 'ready to open'
                        : 'sealed'}
              </span>
            </div>
          )}
      </div>
    </ClothShell>
  );
}

/* ─── The wax seal — the ∞ mark resting warm, the product's ONE emotional
   accent, as plain warm type. No glow, no disc, no circle, no border-radius
   identity chip — the sanctioned bare ∞ glyph alone. ──────────────────────── */
function WaxSeal({ size = 30 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        fontFamily: 'var(--serif-display)',
        fontSize: size,
        fontWeight: 400,
        lineHeight: 1,
        color: 'var(--warm)',
      }}
    >
      ∞
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
          aria-hidden
          style={{
            fontFamily: 'var(--serif-display)',
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
              className="loom-mono"
              style={{ fontSize: 11, color: 'var(--warm)', letterSpacing: '0.26em', textTransform: 'uppercase', marginBottom: 18 }}
            >
              the unlock
            </div>
            <div
              className="loom-serif"
              style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontStyle: 'italic', fontWeight: 300, color: 'var(--bone)', lineHeight: 1.2, letterSpacing: '-0.015em' }}
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
              fontFamily: 'var(--serif-display)',
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
            className="loom-body"
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
            className="loom-body"
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
              await copyToClipboard(text).catch(() => {});
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
