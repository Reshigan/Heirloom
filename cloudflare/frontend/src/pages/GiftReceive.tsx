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
            padding: '84px 56px',
          }}
        >
          <div style={{ maxWidth: 440, width: '100%' }}>
            <p
              className="hl-eyebrow dark"
              style={{ marginBottom: 20 }}
            >
              gift not found
            </p>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 48,
                fontWeight: 300,
                color: 'var(--bone)',
                margin: '0 0 20px',
              }}
            >
              This link has expired.
            </h1>
            <p
              className="hl-prose dark"
              style={{
                fontSize: 17,
                color: 'var(--bone-dim)',
                margin: '0 0 36px',
              }}
            >
              {error}
            </p>
            <button
              onClick={() => navigate('/')}
              className="hl-btn"
            >
              go to heirloom
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
            padding: '84px 56px',
          }}
        >
          <div
            style={{
              maxWidth: 440,
              width: '100%',
              opacity: 0,
              animation: 'css-fade-in 720ms cubic-bezier(0.16,1,0.3,1) forwards',
            }}
            role="status"
          >
            <p
              className="hl-eyebrow dark"
              style={{ marginBottom: 20 }}
            >
              claimed
            </p>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 48,
                fontWeight: 300,
                color: 'var(--bone)',
                margin: '0 0 20px',
              }}
            >
              This thread is yours now.
            </h1>
            <p
              className="hl-prose dark"
              style={{
                fontSize: 17,
                color: 'var(--bone-dim)',
                margin: '0 0 36px',
                lineHeight: 1.85,
              }}
            >
              Create a free account to keep it safe and start your own
              thousand-year thread.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="hl-btn"
            >
              begin a thread
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
      <div style={{ padding: '84px 56px', minHeight: '100%' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>

          {/* H1 */}
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 48,
              fontWeight: 300,
              color: 'var(--bone)',
              margin: '0 0 20px',
            }}
          >
            Someone gave you a thread.
          </h1>

          {/* Hairline rule */}
          <hr className="hl-rule parchment" style={{ margin: '0 0 28px' }} />

          {/* Sender message block — parchment-deep inset */}
          {gift?.personal_message && (
            <div
              style={{
                background: 'var(--parchment-deep)',
                padding: '36px 40px',
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

          {/* Accept button */}
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="hl-btn"
            style={{ marginTop: 24, opacity: claiming ? 0.5 : 1 }}
          >
            {claiming ? 'accepting…' : 'Accept →'}
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
