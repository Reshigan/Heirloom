import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { threadsApi, familyReferralsApi } from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────
type Step = 'thread' | 'entry' | 'invite';
const STEPS: Step[] = ['thread', 'entry', 'invite'];

// ── Styles ────────────────────────────────────────────────────────────────
const screen: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--ink)',
  display: 'flex',
  flexDirection: 'column',
};

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

  // Step 0 — thread name
  const [threadName, setThreadName] = useState(
    user?.lastName ? `The ${user.lastName} Thread` : ''
  );

  // Step 1 — first entry
  const [firstEntry, setFirstEntry] = useState('');

  // Step 2 — invite
  const [inviteEmail, setInviteEmail] = useState('');

  // Persisted across steps
  const [threadId, setThreadId] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = (stepIndex + 1) / STEPS.length;

  // ── Focus helpers for border glow ────────────────────────────────────
  function onFocus(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--rule-strong)';
  }
  function onBlur(e: React.FocusEvent<HTMLElement>) {
    (e.target as HTMLElement).style.borderColor = 'var(--rule)';
  }

  // ── Step handlers ────────────────────────────────────────────────────
  async function submitThread() {
    if (!threadName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await threadsApi.create({
        name: threadName.trim(),
        default_visibility: 'FAMILY',
      });
      const id = data.thread.id;
      setThreadId(id);
      // Persist defaultThreadId so Today/PwaHome can immediately fetch entries
      updateUser({ defaultThreadId: id });
      setStepIndex(1);
    } catch {
      setError('Could not create your thread. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function submitEntry() {
    if (!firstEntry.trim() || !threadId) {
      // Skip gracefully if no entry — thread already exists
      setStepIndex(2);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await threadsApi.createEntry(threadId, {
        body_ciphertext: firstEntry.trim(),
        visibility: 'FAMILY',
        era_year: new Date().getFullYear(),
      });
    } catch {
      // Non-fatal — thread is created, continue
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
    } catch {
      // Non-fatal — still navigate forward
    } finally {
      setBusy(false);
      finish();
    }
  }

  function finish() {
    navigate('/loom/pwa', { replace: true });
  }

  function handleNext() {
    if (step === 'thread') submitThread();
    else if (step === 'entry') submitEntry();
    else submitInvite();
  }

  // ── Screen content ───────────────────────────────────────────────────
  const screens: Record<Step, React.ReactNode> = {
    thread: (
      <>
        <div style={eyebrow}>your family thread</div>
        <h1 style={heading}>Name the thread.</h1>
        <p style={sub}>
          This is the vessel. Every memory you and your family write
          lives here — permanently, across generations.
        </p>
        <input
          style={inputStyle}
          value={threadName}
          onChange={(e) => setThreadName(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
          placeholder="The Smith Thread"
          autoFocus
        />
      </>
    ),

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
    ? step === 'thread'  ? 'creating…'
    : step === 'entry'   ? 'sealing…'
    :                      'inviting…'
    : step === 'thread'  ? 'begin →'
    : step === 'entry'   ? 'seal it →'
    :                      'invite →';

  return (
    <div style={screen}>
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
            disabled={busy || (step === 'thread' && !threadName.trim()) || (step === 'entry' && !firstEntry.trim())}
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
    </div>
  );
}
