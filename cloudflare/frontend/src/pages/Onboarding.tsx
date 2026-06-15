import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { threadsApi, familyReferralsApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Tour } from '../loom/components/Tour';

// ── Types ─────────────────────────────────────────────────────────────────
// The thread itself is created at signup (from the signup form), so onboarding
// opens with the product tour, then the first entry, then an invite. It never
// re-creates the thread.
type Step = 'tour' | 'entry' | 'invite';
const STEPS: Step[] = ['tour', 'entry', 'invite'];
// Step labels track the full tour-led arc so the mono counter reads naturally.
const TOTAL_STEPS = STEPS.length;

// ── Styles ────────────────────────────────────────────────────────────────
// Calm single-question layout: a mono step counter and hairline at the top,
// the question centered in deep negative space, the action anchored low.

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

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.32em',
  textTransform: 'uppercase' as const,
  color: 'var(--warm)',
  textAlign: 'center',
  marginBottom: 28,
};

const questionStyle: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontWeight: 300,
  fontSize: 'clamp(30px, 7vw, 44px)',
  lineHeight: 1.12,
  letterSpacing: '-0.01em',
  color: 'var(--bone)',
  textAlign: 'center',
  margin: 0,
};

const ledeStyle: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontWeight: 300,
  fontSize: 15,
  lineHeight: 1.6,
  color: 'var(--bone-dim)',
  textAlign: 'center',
  margin: '20px auto 0',
  maxWidth: 360,
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

// ── Main ──────────────────────────────────────────────────────────────────
export function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

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

  const progress = (stepIndex + 1) / STEPS.length;

  // ── Focus helpers for border glow ────────────────────────────────────
  function onFocus(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--rule-strong)';
  }
  function onBlur(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--rule)';
  }

  // ── Step handlers ────────────────────────────────────────────────────

  // Resolve the thread id, creating one only if signup somehow didn't.
  async function ensureThreadId(): Promise<string | null> {
    if (threadId) return threadId;
    try {
      const name = user?.lastName ? `The ${user.lastName} Thread` : 'Our Family Thread';
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
      setStepIndex(2);
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
      setStepIndex(2);
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
    entry: (
      <>
        <div style={eyebrowStyle}>first entry</div>
        <h1 style={questionStyle}>Write the first entry</h1>
        <p style={ledeStyle}>
          A memory, a thought, a truth about right now. The cloth begins with this line.
        </p>
        <div style={{ marginTop: 44 }}>
          <textarea
            style={textareaStyle}
            value={firstEntry}
            onChange={(e) => setFirstEntry(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="The first line of a thousand-year thread"
            autoFocus
          />
        </div>
      </>
    ),

    invite: (
      <>
        <div style={eyebrowStyle}>family</div>
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
  const ctaLabel = busy
    ? step === 'entry' ? 'sealing…' : 'inviting…'
    : inviteSent
    ? 'sent ✓'
    : step === 'entry' ? 'seal it →' : 'invite →';

  // The product tour leads onboarding; it manages its own progress + actions.
  if (step === 'tour') {
    return (
      <ClothShell noTopbar>
        <Tour onDone={() => setStepIndex(1)} />
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

      {/* Stage — one question, centered in negative space */}
      <div style={stage}>
        <div style={{ ...stepLabel, marginTop: 18 }}>
          step {stepIndex + 1} of {TOTAL_STEPS}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {screens[step]}

          {error && (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 20, textAlign: 'center' }}>
              {error}
            </p>
          )}
        </div>

        <div style={actions}>
          <button
            type="button"
            className="hl-btn"
            style={{ minWidth: 240 }}
            onClick={handleNext}
            disabled={busy || (step === 'entry' && !firstEntry.trim())}
          >
            {ctaLabel}
          </button>

          {step === 'entry' && (
            <button type="button" style={skipStyle} onClick={() => setStepIndex(2)}>
              skip
            </button>
          )}

          {step === 'invite' && (
            <button type="button" style={skipStyle} onClick={finish}>
              skip for now
            </button>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
