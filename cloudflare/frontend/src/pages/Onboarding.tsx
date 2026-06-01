import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';

const STEPS = ['Name your thread', 'Write your first entry', 'Invite one family member'];

export function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [threadName, setThreadName] = useState(`The ${user?.lastName ?? ''} Thread`.trim());
  const [firstEntry, setFirstEntry] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const progress = (step + 1) / STEPS.length;

  async function handleNext() {
    if (step === 0 && !threadName.trim()) return;
    if (step === 1) {
      if (!firstEntry.trim()) return;
      setBusy(true);
      try {
        await memoriesApi.create({ text: firstEntry, type: 'memory' });
      } catch { /* continue */ }
      setBusy(false);
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      navigate('/loom/today');
    }
  }

  return (
    <div className="hl-screen parchment" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* hairline progress bar */}
      <div style={{ height: 1, background: 'var(--parchment-rule)', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${progress * 100}%`,
          background: 'var(--warm)',
          transition: `width var(--dur-mid) var(--ease)`,
        }} />
      </div>

      <div style={{ flex: 1, padding: '80px 56px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div className="hl-mono" style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
          step {step + 1} of {STEPS.length}
        </div>

        <h1 className="hl-serif hl-tight" style={{ fontSize: 40, fontWeight: 300, color: 'var(--parchment-ink)', margin: '0 0 40px' }}>
          {STEPS[step]}
        </h1>

        {step === 0 && (
          <input
            className="hl-input"
            value={threadName}
            onChange={(e) => setThreadName(e.target.value)}
            placeholder="The Smith Thread"
            autoFocus
          />
        )}

        {step === 1 && (
          <textarea
            className="hl-input"
            value={firstEntry}
            onChange={(e) => setFirstEntry(e.target.value)}
            placeholder="Write anything. A memory, a thought, a fact about today."
            rows={6}
            style={{ resize: 'none' }}
            autoFocus
          />
        )}

        {step === 2 && (
          <input
            className="hl-input"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="grandmother@email.com"
            autoFocus
          />
        )}

        <div style={{ marginTop: 40, display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            type="button"
            className="hl-btn"
            onClick={handleNext}
            disabled={busy}
          >
            {step === STEPS.length - 1 ? 'Go to your thread →' : 'Continue →'}
          </button>
          {step === 2 && (
            <button
              type="button"
              onClick={() => navigate('/loom/today')}
              style={{ background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
