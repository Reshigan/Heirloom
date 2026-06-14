import { useAuthStore } from '../stores/authStore';

export function InviteCard() {
  const { user } = useAuthStore();
  const senderName = user ? `${user.firstName} ${user.lastName}` : 'Your family member';
  const threadName = `The ${user?.lastName ?? ''} Thread`.trim();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="no-print" style={{ padding: '24px 56px', borderBottom: '1px solid var(--parchment-rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--parchment)' }}>
        <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--parchment-dim)' }}>invite card</span>
        <button
          type="button"
          className="hl-btn ghost"
          style={{ color: 'var(--parchment-ink)', borderColor: 'var(--parchment-rule)' }}
          onClick={() => window.print()}
        >
          print →
        </button>
      </div>

      <div style={{
        maxWidth: 640, margin: '80px auto', padding: '64px',
        background: 'var(--parchment)', color: 'var(--parchment-ink)',
        border: '1px solid var(--parchment-rule)',
      }}>
        <p className="hl-eyebrow dark" style={{ margin: '0 0 48px' }}>
          Heirloom · Family Thread
        </p>

        <p className="hl-serif" style={{ fontSize: 'var(--type-subhead)', lineHeight: 1.7, fontWeight: 300, color: 'var(--parchment-ink)', margin: '0 0 32px' }}>
          You have been included in <em>{threadName}</em>.
        </p>

        <p className="hl-prose dark" style={{ marginTop: 0 }}>
          {senderName} has been weaving a family thread — a permanent record of memories, letters, and stories
          that belongs to your bloodline. You are part of it now. Add your voice, or simply read what has been written.
          Entries are append-only. Nothing is silently deleted or rewritten.
        </p>

        <div style={{ margin: '48px 0', padding: '24px 32px', borderLeft: '1px solid var(--parchment-rule)' }}>
          <p className="hl-eyebrow dark" style={{ margin: '0 0 8px' }}>to read the thread</p>
          <p className="hl-serif" style={{ fontSize: 'var(--type-body-lg)', color: 'var(--parchment-ink)', margin: 0 }}>
            heirloom.blue/signup
          </p>
        </div>

        <p className="hl-serif" style={{ fontSize: 14, color: 'var(--parchment-dim)', fontStyle: 'italic', margin: 0 }}>
          — {senderName}
        </p>
      </div>
    </>
  );
}
