import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { giftsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { ClothShell } from '../loom/components/ClothShell';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeColor } from '../loom/dye';

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

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// ── The kind word for a memory type, set in the READING subline ──────────────
function kindWord(memoryType: string): string {
  return memoryType === 'memory'
    ? 'photograph'
    : memoryType === 'voice'
    ? 'recording'
    : 'letter';
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
      navigate(`/signup?redirect=${encodeURIComponent(`/gift-memory/${token}`)}`);
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
            <WaxSeal size={40} />
            <p
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'var(--copper-label)',
                margin: '26px 0 22px',
              }}
            >
              gift not found
            </p>
            <h1
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: 'clamp(30px, 6vw, 44px)',
                fontWeight: 500,
                lineHeight: 1.05,
                color: 'var(--bone)',
                margin: '0 0 18px',
              }}
            >
              This link has expired.
            </h1>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 18,
                color: 'var(--bone-dim)',
                margin: '0 0 36px',
                lineHeight: 1.75,
              }}
            >
              {error}
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                fontFamily: 'var(--mono)',
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
              animation: `css-fade-in 720ms ${EASE} forwards`,
            }}
            role="status"
          >
            <WaxSeal size={44} />
            <p
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'var(--copper-label)',
                margin: '28px 0 22px',
              }}
            >
              claimed
            </p>
            <h1
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: 'clamp(30px, 6vw, 44px)',
                fontWeight: 500,
                lineHeight: 1.05,
                color: 'var(--bone)',
                margin: '0 0 18px',
              }}
            >
              This thread is yours now.
            </h1>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 18,
                color: 'var(--bone-dim)',
                margin: '0 0 36px',
                lineHeight: 1.75,
              }}
            >
              Create a free account to keep it safe and start your own
              thousand-year thread.
            </p>
            <button
              onClick={() => navigate('/signup')}
              style={{
                fontFamily: 'var(--mono)',
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

  // ── Main gift receive screen — READING archetype ──────────────────────────
  // Dye thread for the left margin, hashed off the gift id (stable per gift).
  const dye = gift ? dyeColor(gift.id) : 'var(--rule)';
  const senderName = gift?.sender_name || 'someone';
  const headline = gift?.content?.title || 'Someone gave you a thread.';

  return (
    <ClothShell topbarCenter="a gift">
      <div style={{ position: 'relative', padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', minHeight: '100%' }}>
        {/* Woven unwrap mark — behind the gift, the seal being broken (§woven) */}
        <img
          src="/woven/seal.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'var(--page-pad-top)',
            right: 'clamp(-40px, 2vw, 40px)',
            width: 'clamp(180px, 26vw, 320px)',
            opacity: 0.06,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <article
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 'var(--page-max-focus)',
            margin: '0 auto',
            borderLeft: `3px solid ${dye}`,
            paddingLeft: 24,
          }}
        >
          {/* Serif headline */}
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(30px, 6vw, 44px)',
              fontWeight: 500,
              lineHeight: 1.06,
              letterSpacing: '-0.01em',
              color: 'var(--bone)',
              margin: 0,
            }}
          >
            {headline}
          </h1>

          {/* Mono warm subline — A GIFT FROM <SENDER> [· A <KIND>] */}
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              margin: '20px 0 0',
            }}
          >
            A gift from {senderName}
            {gift?.content && <> · A {kindWord(gift.memory_type)}</>}
          </p>

          {/* Hairline rule */}
          <hr
            style={{
              border: 0,
              borderTop: '1px solid var(--rule)',
              margin: '32px 0',
            }}
          />

          {/* Sender's personal message — justified serif body */}
          {gift?.personal_message && (
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 18,
                lineHeight: 1.75,
                color: 'var(--bone)',
                textAlign: 'justify',
                maxWidth: '62ch',
                margin: '0 0 32px',
              }}
            >
              &ldquo;{gift.personal_message}&rdquo;
            </p>
          )}

          {/* The gifted content — preview body */}
          {gift?.content && (
            <>
              {gift.content.thumbnail_url && (
                <img
                  src={gift.content.thumbnail_url}
                  alt={gift.content.title}
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    width: '62ch',
                    maxHeight: 420,
                    objectFit: 'cover',
                    margin: '0 0 28px',
                  }}
                />
              )}
              {gift.content.preview && (
                <p
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 18,
                    lineHeight: 1.75,
                    color: 'var(--bone-dim)',
                    textAlign: 'justify',
                    maxWidth: '62ch',
                    margin: '0 0 32px',
                  }}
                >
                  {gift.content.preview}
                </p>
              )}
            </>
          )}

          {/* Inline error (claim attempt failed) — mono, never red, never toast */}
          {error && (
            <p
              role="alert"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--warm)',
                letterSpacing: '0.04em',
                margin: '0 0 16px',
              }}
            >
              {error}
            </p>
          )}

          {/* Accept — quiet mono warm text action */}
          <button
            onClick={handleClaim}
            disabled={claiming}
            style={{
              fontFamily: 'var(--mono)',
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
              transition: `opacity 180ms ${EASE}`,
              display: 'block',
            }}
          >
            {claiming ? 'accepting…' : 'accept the gift →'}
          </button>

          {/* Create account link */}
          <p
            style={{
              fontFamily: 'var(--mono)',
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

          {/* WaxSeal foot */}
          <div style={{ margin: '56px 0 0' }}>
            <WaxSeal />
          </div>
        </article>
      </div>
    </ClothShell>
  );
}

export default GiftReceive;
