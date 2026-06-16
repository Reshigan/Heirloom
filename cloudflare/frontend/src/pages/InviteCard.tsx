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

      {/* ── Reading column with dye left-margin thread ── */}
      <div
        style={{
          maxWidth: 640,
          margin: '72px auto 0',
          padding: '0 48px 96px',
        }}
      >
        {/* READING archetype: left dye margin thread */}
        <div
          style={{
            borderLeft: `3px solid ${marginColor}`,
            paddingLeft: 28,
          }}
        >
          {/* Mono warm subline — eyebrow label */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              marginBottom: 20,
            }}
          >
            An Invitation · Heirloom Family Thread
          </div>

          {/* Serif headline — "<Inviter> invites you into <Family>" */}
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(30px, 6vw, 44px)',
              lineHeight: 1.1,
              fontWeight: 400,
              color: 'var(--bone)',
              margin: '0 0 10px',
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
              color: 'var(--warm-dim)',
              marginBottom: 48,
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
              lineHeight: 1.75,
              color: 'var(--bone)',
              textAlign: 'justify',
              maxWidth: '62ch',
              margin: '0 0 48px',
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
              borderLeft: '1px solid var(--rule)',
              paddingLeft: 20,
              margin: '0 0 56px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
                marginBottom: 8,
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
          <div className="no-print" style={{ marginBottom: 56 }}>
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

        {/* WaxSeal foot */}
        <div style={{ marginTop: 72 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </>
  );
}
