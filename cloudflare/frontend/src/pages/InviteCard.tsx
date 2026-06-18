import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { engagementApi } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

/**
 * InviteCard — READING archetype.
 * A printable, shareable invitation into a family thread.
 * Generates a real family_invites code via engagementApi.invite() and renders
 * the working accept link `${origin}/join?code=INV-…` (handled by Join.tsx),
 * replacing the old static heirloom.blue/signup string + /signup CTA.
 */
export function InviteCard() {
  const { user } = useAuthStore();
  const senderName = user ? `${user.firstName} ${user.lastName}` : 'Your family member';
  const threadName = `The ${user?.lastName ?? ''} Thread`.trim();

  // Deterministic warm accent — dye margin uses warm as fallback (no per-entry dye on an invite)
  const marginColor = 'var(--warm-dim)';

  // Real invite wiring — generate an INV- code, then show its /join?code= link.
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://heirloom.blue';
  const inviteUrl = inviteCode ? `${origin}/join?code=${inviteCode}` : null;

  const generate = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter the email of the person you are inviting.');
      return;
    }
    setGenerating(true);
    setError(null);
    engagementApi
      .invite({ email: trimmed })
      .then((res: any) => {
        const code = (res?.data as any)?.inviteCode as string | undefined;
        if (!code) throw new Error('no code');
        setInviteCode(code);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.error ?? 'Could not create the invite. Try again.');
      })
      .finally(() => setGenerating(false));
  };

  const copyLink = () => {
    if (!inviteUrl) return;
    copyToClipboard(inviteUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setError(`Couldn't reach the clipboard. The link is: ${inviteUrl}`);
      });
  };

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
            animation: 'hl-fadeup 720ms var(--ease) both',
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

          {/* Access URL — quiet mono block. Real /join?code= link once generated. */}
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
            {inviteUrl ? (
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 14,
                  letterSpacing: '0.1em',
                  color: 'var(--bone-dim)',
                  wordBreak: 'break-all',
                }}
              >
                {inviteUrl.replace(/^https?:\/\//, '')}
              </div>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  color: 'var(--bone-faint)',
                }}
              >
                Generate a personal invite link below.
              </div>
            )}
          </div>

          {/* Generate / share controls — hidden on print */}
          <div className="no-print" style={{ marginBottom: 64 }}>
            {inviteUrl ? (
              <button
                type="button"
                onClick={copyLink}
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  background: 'transparent',
                  border: '1px solid var(--warm)',
                  padding: '13px 28px',
                  borderRadius: 0,
                  cursor: 'pointer',
                  minHeight: 44,
                  lineHeight: 1,
                }}
              >
                {copied ? 'Link copied' : 'Copy invite link →'}
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="their email"
                  autoComplete="email"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 16,
                    color: 'var(--bone)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--rule)',
                    padding: '8px 4px',
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: 320,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={generate}
                  disabled={generating}
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                    background: 'transparent',
                    border: '1px solid var(--warm)',
                    padding: '13px 28px',
                    borderRadius: 0,
                    cursor: generating ? 'default' : 'pointer',
                    opacity: generating ? 0.6 : 1,
                    minHeight: 44,
                    lineHeight: 1,
                  }}
                >
                  {generating ? 'Generating…' : 'Generate invite link →'}
                </button>
              </div>
            )}

            {error && (
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: 'var(--warm)',
                  margin: '16px auto 0',
                  maxWidth: 360,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
            )}
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
