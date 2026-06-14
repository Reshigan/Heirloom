import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { giftsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { ClothShell } from '../loom/components/ClothShell';

interface GiftData {
  id: string;
  sender_name: string;
  memory_type: string;
  personal_message: string;
  unlock_date: string | null;
  claimed: boolean;
  content?: {
    title: string;
    preview: string;
    thumbnail_url?: string;
  };
}

// ── Loading affordance — 1px hairline shuttle, no spinners (§2.6) ────────────
function LoadingHair() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="progress-hair" style={{ width: 180 }} />
    </div>
  );
}

export function GiftReceive() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [gift, setGift] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // ── Preserve token fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    giftsApi
      .receive(token)
      .then((r) => {
        setGift(r.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Gift not found or has expired.');
        setLoading(false);
      });
  }, [token]);

  const handleClaim = async () => {
    if (!token) return;
    if (!isAuthenticated) {
      localStorage.setItem('PENDING_GIFT_TOKEN', token);
      navigate(`/signup?redirect=${encodeURIComponent(`/gift/receive?token=${token}`)}`);
      return;
    }
    setClaiming(true);
    try {
      await giftsApi.claim(token);
      setClaimed(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to claim gift.');
    }
    setClaiming(false);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ClothShell topbarCenter="a gift">
        <LoadingHair />
      </ClothShell>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && !gift) {
    return (
      <ClothShell topbarCenter="a gift">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          }}
        >
          <div style={{ maxWidth: 'var(--page-max-focus)', width: '100%', textAlign: 'center' }}>
            <div
              className="hl-serif"
              style={{
                fontSize: 44,
                fontWeight: 200,
                lineHeight: 1,
                color: 'var(--warm)',
                opacity: 0.7,
                marginBottom: 28,
              }}
            >
              ∞
            </div>
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                margin: '0 0 22px',
              }}
            >
              gift not found
            </p>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 'var(--type-display)',
                fontWeight: 200,
                color: 'var(--bone)',
                margin: '0 0 18px',
              }}
            >
              This link has expired.
            </h1>
            <p
              className="hl-serif"
              style={{
                fontSize: 'var(--type-body)',
                color: 'var(--bone-dim)',
                margin: '0 0 36px',
                lineHeight: 1.7,
              }}
            >
              {error}
            </p>
            <button
              onClick={() => navigate('/')}
              className="hl-mono"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                cursor: 'pointer',
              }}
            >
              go to heirloom →
            </button>
          </div>
        </div>
      </ClothShell>
    );
  }

  // ── Claimed success state ─────────────────────────────────────────────────
  if (claimed) {
    return (
      <ClothShell topbarCenter="a gift">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          }}
        >
          <div
            style={{
              maxWidth: 'var(--page-max-focus)',
              width: '100%',
              textAlign: 'center',
              opacity: 0,
              animation: 'css-fade-in 720ms cubic-bezier(0.16,1,0.3,1) forwards',
            }}
            role="status"
          >
            {/* ∞ mark — faint amber */}
            <div
              className="hl-serif"
              style={{
                fontSize: 44,
                fontWeight: 200,
                lineHeight: 1,
                color: 'var(--warm)',
                opacity: 0.7,
                marginBottom: 28,
              }}
            >
              ∞
            </div>
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                margin: '0 0 22px',
              }}
            >
              claimed
            </p>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 'var(--type-display)',
                fontWeight: 200,
                color: 'var(--bone)',
                margin: '0 0 18px',
              }}
            >
              This thread is yours now.
            </h1>
            <p
              className="hl-serif"
              style={{
                fontSize: 'var(--type-body)',
                color: 'var(--bone-dim)',
                margin: '0 0 36px',
                lineHeight: 1.7,
              }}
            >
              Create a free account to keep it safe and start your own
              thousand-year thread.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="hl-mono"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                cursor: 'pointer',
              }}
            >
              begin a thread →
            </button>
          </div>
        </div>
      </ClothShell>
    );
  }

  // ── Main gift receive screen ──────────────────────────────────────────────
  return (
    <ClothShell topbarCenter="a gift">

      {/* Content area — below topbar */}
      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', minHeight: '100%' }}>
        <div style={{ maxWidth: 'var(--page-max-focus)', margin: '0 auto' }}>

          {/* H1 — 2-line thin serif */}
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 'var(--type-display)',
              fontWeight: 200,
              color: 'var(--bone)',
              margin: '0 0 20px',
              whiteSpace: 'pre-line',
            }}
          >
            {'Someone gave you\na thread.'}
          </h1>

          {/* Hairline rule */}
          <hr className="hl-rule parchment" style={{ margin: '0 0 28px' }} />

          {/* Sender message block — left-rule quote */}
          {gift?.personal_message && (
            <div
              style={{
                borderLeft: '1px solid var(--warm)',
                paddingLeft: 20,
                maxWidth: 540,
                marginBottom: 32,
              }}
            >
              {gift.sender_name && (
                <p
                  className="hl-serif"
                  style={{
                    fontSize: 16,
                    fontStyle: 'italic',
                    color: 'var(--bone-dim)',
                    margin: '0 0 12px',
                  }}
                >
                  from{' '}
                  <span style={{ color: 'var(--warm)' }}>
                    {gift.sender_name}
                  </span>
                </p>
              )}
              <p
                className="hl-prose dark"
                style={{
                  fontSize: 17,
                  color: 'var(--bone-dim)',
                  margin: 0,
                  lineHeight: 1.85,
                }}
              >
                &ldquo;{gift.personal_message}&rdquo;
              </p>
            </div>
          )}

          {/* Content preview (if present) */}
          {gift?.content && (
            <>
              <hr className="hl-rule parchment" style={{ margin: '0 0 20px' }} />
              <div style={{ marginBottom: 32 }}>
                <p
                  className="hl-eyebrow dark"
                  style={{ marginBottom: 8, color: 'var(--warm)' }}
                >
                  {gift.memory_type === 'memory'
                    ? 'photograph'
                    : gift.memory_type === 'voice'
                    ? 'voice recording'
                    : 'letter'}
                </p>
                <p
                  className="hl-serif"
                  style={{
                    fontSize: 18,
                    fontStyle: 'italic',
                    color: 'var(--bone)',
                    margin: '0 0 6px',
                  }}
                >
                  {gift.content.title}
                </p>
                {gift.content.preview && (
                  <p
                    className="hl-mono"
                    style={{
                      fontSize: 12,
                      color: 'var(--bone-dim)',
                      margin: 0,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {gift.content.preview}
                  </p>
                )}
              </div>
              <hr className="hl-rule parchment" style={{ margin: '0 0 28px' }} />
            </>
          )}

          {/* Inline error (claim attempt failed) */}
          {error && (
            <p
              role="alert"
              className="hl-mono"
              style={{
                fontSize: 11,
                color: 'var(--danger)',
                letterSpacing: '0.04em',
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          {/* Accept — amber mono text-link */}
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="hl-mono"
            style={{
              marginTop: 24,
              background: 'transparent',
              border: 0,
              padding: 0,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              opacity: claiming ? 0.5 : 1,
              cursor: claiming ? 'default' : 'pointer',
              transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {claiming ? 'accepting…' : 'accept the gift →'}
          </button>

          {/* Create account link */}
          <p
            className="hl-mono"
            style={{
              marginTop: 20,
              fontSize: 10.5,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            <Link
              to="/signup"
              style={{
                color: 'var(--warm)',
                textDecoration: 'none',
              }}
            >
              create an account →
            </Link>
          </p>

        </div>
      </div>
    </ClothShell>
  );
}

export default GiftReceive;
