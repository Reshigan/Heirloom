import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { threadsApi, memoriesApi, engagementApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Tour } from '../loom/components/Tour';
import { WeaveCeremony } from '../loom/components/WeaveCeremony';
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
  letterSpacing: '0.2em',
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
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: 'var(--warm)',
  textAlign: 'center',
  margin: '22px 0 28px',
};

// The ceremony title — serif, centered, the moment's name in the bloodline's
// own voice. CEREMONY scale: clamp(24px, 5vw, 34px).
const heroHeadlineStyle: React.CSSProperties = {
  fontFamily: 'var(--serif-display)',
  fontWeight: 400,
  fontSize: 'clamp(24px, 5vw, 34px)',
  lineHeight: 1.1,
  letterSpacing: '-0.012em',
  color: 'var(--bone)',
  textAlign: 'center',
  margin: 0,
};

const questionStyle: React.CSSProperties = {
  fontFamily: 'var(--serif-display)',
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
  boxSizing: 'border-box' as const,
  transition: 'border-color 180ms var(--ease)',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  outline: 'none', // composer is intentionally ring-free (ART_DIRECTION: "no focus glow")
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
  padding: '12px 0',
  minHeight: 44,
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
// deep water owns the empty upper air, the verb beneath it, and a quiet
// sign-in foot. Centered, vast negative space — no page-owned canvas.
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

// The promise — Fraunces display, centered, two lines, the bloodline's own
// voice. Display scale only (legible >=24px).
const welcomeTitle: React.CSSProperties = {
  fontFamily: 'var(--serif-display)',
  fontWeight: 600,
  fontSize: 'clamp(36px, 11vw, 44px)',
  lineHeight: 1.04,
  letterSpacing: '-0.018em',
  color: 'var(--bone)',
  textAlign: 'center',
  margin: '0 0 18px',
};

// Source Serif 4 subhead under the welcome title — the quiet promise of the product.
const welcomeSubhead: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontWeight: 400,
  fontSize: 17,
  lineHeight: 1.55,
  color: 'var(--bone-dim)',
  textAlign: 'center',
  margin: '0 auto',
  maxWidth: 380,
};

// Thin framing hairlines bracketing the welcome promise.
const welcomeRule: React.CSSProperties = {
  height: 1,
  width: '100%',
  maxWidth: 420,
  background: 'var(--hairline-2)',
  margin: '0 auto',
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
  letterSpacing: '0.2em',
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
  minHeight: 44,
  padding: '13px 30px',
  borderRadius: 0,
  border: '1px solid var(--warm-dim)',
  background: 'transparent',
  color: 'var(--warm-bright)',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  touchAction: 'manipulation',
  transition: 'border-color 180ms var(--ease)', // ponytail: color is identical rest/hover — dead leg dropped
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
  letterSpacing: '0.2em',
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

  // On every step change, move keyboard focus to the new step's heading so the
  // ceremony is operable by keyboard and screen reader without hunting. The
  // heading carries tabIndex={-1} so it can hold focus without being a tab stop.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);

  // First entry
  const [firstEntry, setFirstEntry] = useState('');

  // The weave beat that plays once the first line persists — mirrors Compose's
  // `woven` flag: true → render <WeaveCeremony/>, then advance to the invite.
  const [woven, setWoven] = useState(false);

  // Invite — the whole bloodline at once. A small set of email rows; empties are
  // ignored, the rest are de-duped and each gets its own invitation.
  const [inviteEmails, setInviteEmails] = useState<string[]>(['', '']);

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
  function onBlur(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--rule)';
  }

  // ── Step handlers ────────────────────────────────────────────────────

  // Resolve the thread id, creating one only if signup somehow didn't. The
  // surname captured at signup names it — onboarding no longer re-asks.
  async function ensureThreadId(): Promise<string | null> {
    if (threadId) return threadId;
    try {
      const surname = user?.lastName?.trim();
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
      // Still create+name the family thread (sets defaultThreadId; load-bearing
      // for the Family page + invites) — but the first words MUST land in the
      // memories store, which is what the home cloth (useTapestryEntries) and
      // the new-user check (useIsNewUser) actually read. Writing to thread_entries
      // left the opening line invisible and re-prompted the family as if empty.
      await ensureThreadId();
      const surname = user?.lastName?.trim();
      await memoriesApi.create({
        type: 'TEXT',
        ...(surname ? { title: `The ${surname} Thread` } : {}),
        description: firstEntry.trim(),
        metadata: { visibility: 'FAMILY' },
      });
      // The first line is in the cloth — play the weave beat, then the ceremony's
      // onDone advances to the invite. (Empty entries returned above, never here.)
      setBusy(false);
      setWoven(true);
      return;
    } catch {
      // Non-fatal — continue forward
    }
    setBusy(false);
    goTo('invite');
  }

  async function submitInvite() {
    const filled = inviteEmails.map((e) => e.trim()).filter(Boolean);
    if (filled.length === 0) {
      finish();
      return;
    }
    if (filled.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
      setError('One of those addresses looks off — check it, or clear the row.');
      return;
    }
    // De-dupe, case-insensitive, preserving order.
    const seen = new Set<string>();
    const emails = filled.filter((e) => {
      const k = e.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    setBusy(true);
    setError(null);
    try {
      // engagementApi.invite issues a /join?code=INV- link that the working
      // PendingInviteAcceptor relay redeems into thread_members. The old
      // familyReferralsApi.createInvite emailed /signup?ref= — a code Signup
      // never reads, so invitees never joined the family cloth.
      await Promise.all(emails.map((email) => engagementApi.invite({ email })));
      setInviteSent(true);
    } catch {
      setError('Could not send the invitations — try again, or skip.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!inviteSent) return;
    const t = setTimeout(finish, 1500);
    return () => clearTimeout(t);
  }, [inviteSent]);

  // The weave beat has no completion callback — let its rise animation play,
  // then advance to the invite step. Mirrors Compose's post-weave timer.
  useEffect(() => {
    if (!woven) return;
    const t = setTimeout(() => {
      setWoven(false);
      goTo('invite');
    }, 1400);
    return () => clearTimeout(t);
  }, [woven]);

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
        <h1 ref={headingRef} tabIndex={-1} style={{ ...heroHeadlineStyle, outline: 'none' }}>Begin the thread.</h1>
        <p style={ledeStyle}>One line is enough to begin.</p>

        <div style={{ marginTop: 36 }}>
          <textarea
            style={textareaStyle}
            value={firstEntry}
            onChange={(e) => setFirstEntry(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="The first line of your family's Deep"
            aria-label="Your first entry"
          />
        </div>
      </>
    ),

    invite: (
      <>
        <div style={crownWrap}><WaxSeal size={56} /></div>
        <div style={eyebrowStyle}>The Bloodline</div>
        <h1 ref={headingRef} tabIndex={-1} style={{ ...questionStyle, outline: 'none' }}>Who else tends this thread?</h1>
        <p style={ledeStyle}>
          Invite the whole bloodline — a partner, a parent, a grown child. Each receives an invitation to join.
        </p>
        <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {inviteEmails.map((email, i) => (
            <input
              key={i}
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) =>
                setInviteEmails((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
              }
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              placeholder="name@example.com"
              aria-label={`Invite someone's email address, row ${i + 1}`}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'onboarding-error' : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setInviteEmails((prev) => [...prev, ''])}
          style={{
            marginTop: 18,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--bone-dim)',
          }}
        >
          add another
        </button>

        {/* One quiet hairline offer — only once a line has been woven. A calm
            Source Serif 4 sentence + a JetBrains Mono copper text-link to keep the thread.
            No banner, no card, no countdown. */}
        {firstEntry.trim() && (
          <p style={{ ...ledeStyle, fontStyle: 'normal', marginTop: 40, fontSize: 15 }}>
            The thread is yours to keep.&nbsp;
            <Link
              to="/billing"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--rule-strong)',
                paddingBottom: 3,
                whiteSpace: 'nowrap',
              }}
            >
              keep the thread →
            </Link>
          </p>
        )}
      </>
    ),
  };

  // ── CTA label ────────────────────────────────────────────────────────
  // Entry is the hero step; its CTA is the mono "START YOUR THREAD".
  const ctaLabel = busy
    ? step === 'entry' ? 'saving…' : 'inviting…'
    : inviteSent
    ? 'invitation sent'
    : step === 'entry' ? 'start your thread' : 'invite →';

  // The welcome ceremony opens onboarding — vast air, the deep water
  // crowning the top, the promise held low in serif, and one outlined amber
  // verb that begins the thread. No page-owned backdrop: the global
  // ClothBackdrop paints the deep water for this route.
  // The aha beat — the first line woven into the global cloth, before the invite.
  if (woven) {
    return (
      <ClothShell noTopbar>
        <WeaveCeremony
          dye="walnut"
          entryDate={new Date()}
          seed={user?.lastName?.trim() || 'thread'}
          eyebrow="lowered into the Deep"
          headline="Your first line is part of the Deep."
        />
      </ClothShell>
    );
  }

  if (step === 'welcome') {
    return (
      <ClothShell noTopbar>
        <div style={{ ...welcomeStage, position: 'relative' }}>
          {/* the upper two-thirds is left empty — the deep water breathes there */}
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }} aria-hidden />

          <div style={welcomeRule} aria-hidden />
          <div style={{ position: 'relative', zIndex: 1, paddingTop: 30, paddingBottom: 30 }}>
            <h1 ref={headingRef} tabIndex={-1} style={{ ...welcomeTitle, outline: 'none' }}>
              Some things
              <br />
              only get deeper.
            </h1>
            <p style={welcomeSubhead}>
              A journal of shared history, preserved for generations.
            </p>
          </div>
          <div style={welcomeRule} aria-hidden />

          <div style={{ ...welcomeActions, position: 'relative', zIndex: 1 }}>
            <button
              type="button"
              style={pillStyle}
              onClick={() => goTo('tour')}
              onMouseEnter={pillHover}
              onMouseLeave={pillLeave}
            >
              begin
            </button>

            <div style={welcomeFoot}>
              already have a thread?&nbsp;·&nbsp;
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
            background: 'var(--bone-dim)',
            transition: 'width 360ms var(--ease)',
          }}
        />
      </div>

      {/* Stage — one question, centered in negative space, over the global
          deep-water backdrop (no page-owned canvas) */}
      <div style={{ ...stage, position: 'relative' }}>
        <div style={{ ...stepLabel, marginTop: 18, position: 'relative', zIndex: 1 }}>
          step {numberedIndex + 1} of {TOTAL_STEPS}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          {screens[step]}

          {error && (
            <p id="onboarding-error" role="alert" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 20, textAlign: 'center' }}>
              {error}
            </p>
          )}

          {/* Transient confirmations announced to assistive tech without
              disturbing the calm visual surface (the CTA label carries the
              visible copy). Politely interrupting nothing — info only. */}
          <div
            role="status"
            aria-live="polite"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {inviteSent ? 'Invitation sent.' : ''}
          </div>
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
