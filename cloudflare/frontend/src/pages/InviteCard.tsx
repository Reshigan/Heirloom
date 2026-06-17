import { useAuthStore } from '../stores/authStore';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

/**
 * InviteCard — READING archetype.
 * A printable, shareable invitation into a family thread.
 * No token validation / accept flow exists in this component;
 * the CTA routes to /signup, matching the displayed URL.
 */
export function InviteCard() {
  const { user } = useAuthStore();
  const senderName = user ? `${user.firstName} ${user.lastName}` : 'Your family member';
  const threadName = `The ${user?.lastName ?? ''} Thread`.trim();

  // Deterministic warm accent — dye margin uses warm as fallback (no per-entry dye on an invite)
  const marginColor = 'var(--warm-dim)';

  return (
    <>
      {/* Print media — hides no-print controls, resets background */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      {/* ── Print control bar (hidden on print) ── */}
      <div
        className="no-print"
        style={{
          padding: '20px 48px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          Invite Card
        </span>

        {/* Print button — same onClick as before */}
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 0',
          }}
        >
          Print →
        </button>
      </div>

      {/* ── Ceremonial column — centered composition, generous breathing room ── */}
      <div
        style={{
          maxWidth: 600,
          margin: '120px auto 0',
          padding: '0 48px 120px',
          textAlign: 'center',
        }}
      >
        {/* Ceremony archetype: centered dye thread crowning the card */}
        <div
          style={{
            width: 3,
            height: 56,
            background: marginColor,
            margin: '0 auto 44px',
          }}
          aria-hidden
        />
        <div
          style={{
            animation: 'hl-fadeup 720ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          {/* Mono warm subline — eyebrow label */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
              marginBottom: 28,
            }}
          >
            An Invitation · Heirloom Family Thread
          </div>

          {/* Display headline — "<Inviter> invites you into <Family>" */}
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(30px, 6vw, 44px)',
              lineHeight: 1.12,
              fontWeight: 500,
              color: 'var(--bone)',
              margin: '0 0 16px',
              letterSpacing: '-0.01em',
            }}
          >
            {senderName} invites you into{' '}
            <em style={{ fontStyle: 'italic' }}>{threadName}</em>
          </h1>

          {/* Mono warm subline — sender attribution */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--gold-text)',
              marginBottom: 56,
            }}
          >
            From {senderName}
          </div>

          {/* Serif-italic message body */}
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.8,
              color: 'var(--bone)',
              maxWidth: '52ch',
              margin: '0 auto 56px',
            }}
          >
            {senderName} has been weaving a family thread — a permanent record of memories,
            letters, and stories that belongs to your bloodline. You are part of it now.
            Add your voice, or simply read what has been written. Entries are append-only.
            Nothing is silently deleted or rewritten.
          </p>

          {/* Access URL — quiet mono block */}
          <div
            style={{
              margin: '0 auto 64px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
                marginBottom: 10,
              }}
            >
              To read the thread
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 14,
                letterSpacing: '0.1em',
                color: 'var(--bone-dim)',
              }}
            >
              heirloom.blue/signup
            </div>
          </div>

          {/* Primary CTA — mono warm pill (pill radius allowed on single primary CTA) */}
          <div className="no-print" style={{ marginBottom: 64 }}>
            <a
              href="/signup"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                background: 'var(--warm)',
                padding: '13px 28px',
                borderRadius: 999,
                textDecoration: 'none',
                minHeight: 44,
                lineHeight: 1,
              }}
            >
              Join the Thread →
            </a>
          </div>

          {/* Serif-italic closing signature */}
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--bone-dim)',
              margin: 0,
            }}
          >
            — {senderName}
          </p>
        </div>

        {/* WaxSeal foot — the lone ∞ mark, centered to seal the card */}
        <div style={{ marginTop: 88, display: 'flex', justifyContent: 'center' }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </>
  );
}
