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

// ── Styles ────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  flex: 1,
  padding: 'clamp(48px, 10vw, 96px) clamp(24px, 8vw, 96px)',
  maxWidth: 560,
  width: '100%',
};

const eyebrow: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--bone-faint)',
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  marginBottom: 28,
};

const heading: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontSize: 'clamp(28px, 6vw, 44px)',
  fontWeight: 300,
  color: 'var(--bone)',
  margin: '0 0 14px',
  lineHeight: 1.12,
  letterSpacing: '-0.016em',
};

const sub: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontSize: 16,
  fontWeight: 300,
  lineHeight: 1.7,
  color: 'var(--bone-dim)',
  margin: '0 0 40px',
  maxWidth: '40ch',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--rule)',
  borderRadius: 2,
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--serif)',
  fontSize: 18,
  fontWeight: 300,
  lineHeight: 1.6,
  padding: '14px 16px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 180ms var(--ease)',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'none' as const,
  minHeight: 160,
  fontSize: 16,
};

const actions: React.CSSProperties = {
  marginTop: 40,
  display: 'flex',
  alignItems: 'center',
  gap: 20,
};

const skipStyle: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  padding: '10px 0',
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
  const screens: Record<'entry' | 'invite', React.ReactNode> = {
    entry: (
      <>
        <div style={eyebrow}>first entry</div>
        <h1 style={heading}>Write the first entry.</h1>
        <p style={sub}>
          A memory, a thought, a truth about right now.
          The cloth begins with this line.
        </p>
        <textarea
          style={textareaStyle}
          value={firstEntry}
          onChange={(e) => setFirstEntry(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Write anything. The first line of a thousand-year thread."
          autoFocus
        />
      </>
    ),

    invite: (
      <>
        <div style={eyebrow}>family</div>
        <h1 style={heading}>Who else tends this thread?</h1>
        <p style={sub}>
          Invite one person — a partner, a parent, a grown child.
          They'll receive an invitation to join.
        </p>
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

      {/* Content */}
      <div style={body}>
        {screens[step]}

        {error && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 12 }}>
            {error}
          </p>
        )}

        <div style={actions}>
          <button
            type="button"
            className="hl-btn"
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
