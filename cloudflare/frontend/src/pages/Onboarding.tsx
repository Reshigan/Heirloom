import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { threadsApi, familyReferralsApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Tour } from '../loom/components/Tour';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

// ── Types ─────────────────────────────────────────────────────────────────
// The thread itself is created at signup (from the signup form), so onboarding
// opens with the welcome ceremony, then the product tour, then the first entry,
// then an invite. It never re-creates the thread.
type Step = 'welcome' | 'tour' | 'entry' | 'invite';
const STEPS: Step[] = ['welcome', 'tour', 'entry', 'invite'];
// The numbered ceremony steps (entry + invite) the mono counter reads against —
// welcome and the tour crown the arc and sit outside the count.
const NUMBERED_STEPS: Step[] = ['entry', 'invite'];
const TOTAL_STEPS = NUMBERED_STEPS.length;

// ── Styles ────────────────────────────────────────────────────────────────
// The welcome ceremony: centered, vast air. A glowing warm ∞ crowns each step,
// a serif title holds the centre, mono warm meta names the moment, and a
// serif-italic byline whispers the promise. One question per page; the action
// rests low as a mono warm verb between steps.

const stage: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-pad-x)',
  maxWidth: 'var(--page-max-focus)',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
};

const stepLabel: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.32em',
  textTransform: 'uppercase' as const,
  color: 'var(--bone-faint)',
  textAlign: 'center',
  marginBottom: 14,
};

// Mono warm meta — the ceremony's "what this moment is" line, uppercase,
// resting just under the crowning ∞.
const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.26em',
  textTransform: 'uppercase' as const,
  color: 'var(--warm)',
  textAlign: 'center',
  margin: '22px 0 28px',
};

// The ceremony title — serif, centered, the moment's name in the bloodline's
// own voice. CEREMONY scale: clamp(24px, 5vw, 34px).
const heroHeadlineStyle: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontWeight: 400,
  fontSize: 'clamp(24px, 5vw, 34px)',
  lineHeight: 1.1,
  letterSpacing: '-0.012em',
  color: 'var(--bone)',
  textAlign: 'center',
  margin: 0,
  fontVariationSettings: '"opsz" 40',
};

const questionStyle: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontWeight: 400,
  fontSize: 'clamp(24px, 5vw, 34px)',
  lineHeight: 1.12,
  letterSpacing: '-0.012em',
  color: 'var(--bone)',
  textAlign: 'center',
  margin: 0,
};

// Serif-italic byline — dim, the confidential-space promise spoken quietly
// beneath the title.
const ledeStyle: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontStyle: 'italic',
  fontWeight: 300,
  fontSize: 16,
  lineHeight: 1.6,
  color: 'var(--bone-dim)',
  textAlign: 'center',
  margin: '22px auto 0',
  maxWidth: 380,
};

// Wrapper that gives the crowning WaxSeal ∞ breathing room above the meta line.
const crownWrap: React.CSSProperties = {
  marginBottom: 8,
};

// Underlined input — no box, just a hairline rule under the text (mockup).
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  borderRadius: 0,
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--serif)',
  fontSize: 18,
  fontWeight: 300,
  lineHeight: 1.6,
  padding: '12px 2px',
  textAlign: 'center',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 180ms var(--ease)',
};

// Hero family-name input — underline only, centered, ~360px, breathing room
// above and below. Caret + focus underline carry the one warm colour.
const heroInputStyle: React.CSSProperties = {
  ...inputStyle,
  maxWidth: 360,
  margin: '36px auto',
  fontSize: 20,
  fontWeight: 400,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'none' as const,
  minHeight: 120,
  fontSize: 17,
  textAlign: 'center',
  lineHeight: 1.55,
};

const actions: React.CSSProperties = {
  marginTop: 'auto',
  paddingTop: 40,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 18,
};

const skipStyle: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  padding: '8px 0',
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--bone-faint)',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  touchAction: 'manipulation',
};

// ── Welcome ceremony ────────────────────────────────────────────────────
// The opening surface: a full-height column, the promise held low so the
// global crescent filament owns the empty upper air, the verb beneath it, and
// a quiet sign-in foot. Centered, vast negative space — no page-owned canvas.
const welcomeStage: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 'var(--page-pad-top) var(--page-pad-x) calc(var(--page-pad-x) + env(safe-area-inset-bottom,0px))',
  maxWidth: 'var(--page-max-focus)',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
};

// The promise — serif, centered, two lines, the bloodline's own voice.
const welcomeTitle: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontWeight: 400,
  fontSize: 'clamp(28px, 7vw, 40px)',
  lineHeight: 1.12,
  letterSpacing: '-0.018em',
  color: 'var(--bone)',
  textAlign: 'center',
  margin: '0 0 36px',
  fontVariationSettings: '"opsz" 40',
};

const welcomeActions: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 30,
  paddingBottom: 12,
};

// Quiet mono foot — uppercase, bone-faint, the sign-in escape hatch.
const welcomeFoot: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: 'var(--bone-faint)',
  textAlign: 'center',
};

const welcomeFootLink: React.CSSProperties = {
  color: 'var(--bone-dim)',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  textDecorationColor: 'var(--rule)',
};

// Outlined amber pill — warm hairline border, mono uppercase label, no fill.
const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 200,
  padding: '13px 30px',
  borderRadius: 999,
  border: '1px solid var(--warm-dim)',
  background: 'transparent',
  color: 'var(--warm-bright)',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.28em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  touchAction: 'manipulation',
  transition: 'border-color 180ms var(--ease), color 180ms var(--ease)',
};

function pillHover(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.borderColor = 'var(--warm)';
  e.currentTarget.style.color = 'var(--warm-bright)';
}
function pillLeave(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.borderColor = 'var(--warm-dim)';
  e.currentTarget.style.color = 'var(--warm-bright)';
}

// Bare warm text CTA — mono uppercase, no border or fill (the hero step's
// "START YOUR THREAD"). 44px min touch height; hover lifts to warm-bright.
const ctaTextStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '11px 8px',
  border: 0,
  background: 'transparent',
  color: 'var(--warm)',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.26em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  touchAction: 'manipulation',
  transition: 'color 180ms var(--ease)',
};

function ctaTextHover(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.color = 'var(--warm-bright)';
}
function ctaTextLeave(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.color = 'var(--warm)';
}

// ── Main ──────────────────────────────────────────────────────────────────
export function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  // Advance by step name so the wizard order can shift without chasing indices.
  const goTo = (s: Step) => setStepIndex(STEPS.indexOf(s));

  // Family name — seeded from the surname captured at signup. This names the
  // bloodline's thread; it feeds the thread-naming logic in ensureThreadId.
  const [familyName, setFamilyName] = useState(user?.lastName?.trim() ?? '');

  // First entry
  const [firstEntry, setFirstEntry] = useState('');

  // Invite
  const [inviteEmail, setInviteEmail] = useState('');

  // The thread already exists (created at signup). Resolve its id so the first
  // entry lands on it — prefer the stored defaultThreadId, fall back to the
  // thread list, and only as a last resort create one.
  const [threadId, setThreadId] = useState<string | null>(user?.defaultThreadId ?? null);

  useEffect(() => {
    if (threadId) return;
    let cancelled = false;
    (async () => {
      try {
        const { threads } = (await threadsApi.list()).data;
        if (cancelled) return;
        if (threads.length > 0) {
          setThreadId(threads[0].id);
          updateUser({ defaultThreadId: threads[0].id });
        }
      } catch {
        /* non-fatal — submitEntry will create one if still missing */
      }
    })();
    return () => { cancelled = true; };
  }, [threadId, updateUser]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  // The hairline + mono counter track only the numbered ceremony steps.
  const numberedIndex = NUMBERED_STEPS.indexOf(step as Step);
  const progress = (numberedIndex + 1) / NUMBERED_STEPS.length;

  // ── Focus helpers for border glow ────────────────────────────────────
  function onFocus(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--rule-strong)';
  }
  // Hero family-name field lifts its underline to the one warm colour on focus.
  function onWarmFocus(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--warm)';
  }
  function onBlur(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--rule)';
  }

  // ── Step handlers ────────────────────────────────────────────────────

  // Resolve the thread id, creating one only if signup somehow didn't. The
  // hero's family-name field (falling back to the signup surname) names it.
  async function ensureThreadId(): Promise<string | null> {
    if (threadId) return threadId;
    try {
      const surname = familyName.trim() || user?.lastName?.trim();
      const name = surname ? `The ${surname} Thread` : 'Our Family Thread';
      const { data } = await threadsApi.create({ name, default_visibility: 'FAMILY' });
      const id = data.thread.id;
      setThreadId(id);
      updateUser({ defaultThreadId: id });
      return id;
    } catch {
      return null;
    }
  }

  async function submitEntry() {
    if (!firstEntry.trim()) {
      goTo('invite');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await ensureThreadId();
      if (id) {
        await threadsApi.createEntry(id, {
          body_ciphertext: firstEntry.trim(),
          visibility: 'FAMILY',
          era_year: new Date().getFullYear(),
        });
      }
    } catch {
      // Non-fatal — continue forward
    } finally {
      setBusy(false);
      goTo('invite');
    }
  }

  async function submitInvite() {
    if (!inviteEmail.trim()) {
      finish();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await familyReferralsApi.createInvite({ email: inviteEmail.trim() });
      setInviteSent(true);
    } catch {
      // Non-fatal — still navigate forward
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!inviteSent) return;
    const t = setTimeout(finish, 1500);
    return () => clearTimeout(t);
  }, [inviteSent]);

  function finish() {
    navigate('/loom/pwa', { replace: true });
  }

  function handleNext() {
    if (step === 'entry') submitEntry();
    else submitInvite();
  }

  // ── Screen content ───────────────────────────────────────────────────
  // The 'tour' step is rendered full-bleed (see below) and isn't in this map.
  // Each screen is one calm question, centered in negative space.
  const screens: Record<'entry' | 'invite', React.ReactNode> = {
    // The first rite — the family-name field names the bloodline's thread; the
    // first-entry line begins the cloth beneath it. The glowing ∞ crowns it.
    entry: (
      <>
        <div style={crownWrap}><WaxSeal size={56} /></div>
        <div style={eyebrowStyle}>Entry No. 0001</div>
        <h1 style={heroHeadlineStyle}>Begin the thread.</h1>
        <p style={ledeStyle}>A confidential, private space for your legacy.</p>

        <input
          style={heroInputStyle}
          type="text"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          onFocus={onWarmFocus}
          onBlur={onBlur}
          placeholder="your family name"
          aria-label="Your family name"
          autoFocus
        />

        <div style={{ marginTop: 4 }}>
          <textarea
            style={textareaStyle}
            value={firstEntry}
            onChange={(e) => setFirstEntry(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="The first line of a thousand-year thread"
          />
        </div>
      </>
    ),

    invite: (
      <>
        <div style={crownWrap}><WaxSeal size={56} /></div>
        <div style={eyebrowStyle}>The Bloodline</div>
        <h1 style={questionStyle}>Who else tends this thread?</h1>
        <p style={ledeStyle}>
          Invite one person — a partner, a parent, a grown child. They'll receive an invitation to join.
        </p>
        <div style={{ marginTop: 44 }}>
          <input
            style={inputStyle}
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            placeholder="name@example.com"
            autoFocus
          />
        </div>
      </>
    ),
  };

  // ── CTA label ────────────────────────────────────────────────────────
  // Entry is the hero step; its CTA is the mono "START YOUR THREAD".
  const ctaLabel = busy
    ? step === 'entry' ? 'sealing…' : 'inviting…'
    : inviteSent
    ? 'invitation sent'
    : step === 'entry' ? 'start your thread' : 'invite →';

  // The welcome ceremony opens onboarding — vast air, the global crescent
  // filament crowning the top, the promise held low in serif, and one outlined
  // amber verb that begins the thread. No page-owned backdrop: the global
  // ClothBackdrop paints the crescent for this route.
  if (step === 'welcome') {
    return (
      <ClothShell noTopbar>
        <div style={welcomeStage}>
          {/* the upper two-thirds is left empty — the crescent filament breathes there */}
          <div style={{ flex: 1 }} aria-hidden />

          <h1 style={welcomeTitle}>
            Start your family’s
            <br />
            thousand-year thread.
          </h1>

          <div style={welcomeActions}>
            <button
              type="button"
              style={pillStyle}
              onClick={() => goTo('tour')}
              onMouseEnter={pillHover}
              onMouseLeave={pillLeave}
            >
              begin the thread
            </button>

            <div style={welcomeFoot}>
              already weaving?&nbsp;·&nbsp;
              <Link to="/login" style={welcomeFootLink}>
                sign in
              </Link>
            </div>
          </div>
        </div>
      </ClothShell>
    );
  }

  // The product tour follows the welcome; it manages its own progress + actions.
  if (step === 'tour') {
    return (
      <ClothShell noTopbar>
        <Tour onDone={() => goTo('entry')} />
      </ClothShell>
    );
  }

  return (
    <ClothShell noTopbar>
      {/* Hairline progress */}
      <div style={{ height: 1, background: 'var(--rule)', position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress * 100}%`,
            background: 'var(--warm)',
            transition: 'width 360ms var(--ease)',
          }}
        />
      </div>

      {/* Stage — one question, centered in negative space, over the global
          filament backdrop (no page-owned canvas) */}
      <div style={{ ...stage, position: 'relative' }}>
        <div style={{ ...stepLabel, marginTop: 18, position: 'relative', zIndex: 1 }}>
          step {numberedIndex + 1} of {TOTAL_STEPS}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          {screens[step]}

          {error && (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 20, textAlign: 'center' }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ ...actions, position: 'relative', zIndex: 1 }}>
          {step === 'entry' ? (
            // Hero: bare warm "START YOUR THREAD" — the ∞ already rests in the
            // hero above, so no second seal here.
            <button
              type="button"
              style={{ ...ctaTextStyle, opacity: busy ? 0.4 : 1, cursor: busy ? 'default' : 'pointer' }}
              onClick={handleNext}
              onMouseEnter={ctaTextHover}
              onMouseLeave={ctaTextLeave}
              disabled={busy}
            >
              {ctaLabel}
            </button>
          ) : (
            <>
              <button
                type="button"
                style={pillStyle}
                onClick={handleNext}
                onMouseEnter={pillHover}
                onMouseLeave={pillLeave}
                disabled={busy}
              >
                {ctaLabel}
              </button>
              <button type="button" style={skipStyle} onClick={finish}>
                skip for now
              </button>
            </>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
