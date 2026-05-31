import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { giftsApi } from '../services/api';

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

const SHUTTLE_STYLE: React.CSSProperties = {
  position: 'relative',
  height: 1,
  background: 'var(--loom-rule)',
  width: 180,
  overflow: 'hidden',
};

function LoadingShuttle() {
  return (
    <div style={SHUTTLE_STYLE}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '40%',
          background: 'var(--loom-warm)',
          animation: 'loom-shuttle 1.4s var(--loom-ease) infinite',
        }}
      />
    </div>
  );
}

export function GiftReceive() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [gift, setGift] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!token) return;
    giftsApi.receive(token)
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
    setClaiming(true);
    try {
      await giftsApi.claim(token);
      setClaimed(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to claim gift.');
    }
    setClaiming(false);
  };

  const centerWrap: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--loom-ink)',
    color: 'var(--loom-bone)',
    display: 'grid',
    placeItems: 'center',
    padding: '40px 24px',
  };

  if (loading) {
    return (
      <div style={centerWrap}>
        <LoadingShuttle />
      </div>
    );
  }

  if (error) {
    return (
      <div style={centerWrap}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 20 }}>gift not found</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}
          >
            This link has expired.
          </h1>
          <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 15, margin: '0 0 36px' }}>
            {error}
          </p>
          <button onClick={() => navigate('/')} className="loom-btn">
            go to heirloom
          </button>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div style={centerWrap}>
        <div
          style={{
            textAlign: 'center',
            maxWidth: 440,
            opacity: 0,
            animation: 'loom-fade-in 720ms var(--loom-ease) forwards',
          }}
          role="status"
        >
          <p className="loom-eyebrow" style={{ marginBottom: 20 }}>claimed</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 20px' }}
          >
            This thread is yours now.
          </h1>
          <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 16, margin: '0 0 40px', lineHeight: 1.7 }}>
            Create a free account to keep it safe and start your own thousand-year thread.
          </p>
          <button onClick={() => navigate('/signup')} className="loom-btn">
            begin a thread
          </button>
        </div>
      </div>
    );
  }

  const typeLabel =
    gift?.memory_type === 'memory' ? 'photograph' :
    gift?.memory_type === 'voice' ? 'voice recording' :
    'letter';

  return (
    <div style={centerWrap}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 20, textAlign: 'center' }}>
          a gift of a thread
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 8px', textAlign: 'center' }}
        >
          You've received a gift.
        </h1>
        {gift?.sender_name && (
          <p
            className="loom-body"
            style={{ textAlign: 'center', color: 'var(--loom-bone-dim)', fontSize: 16, margin: '0 0 32px' }}
          >
            from{' '}
            <span style={{ color: 'var(--loom-warm)' }}>{gift.sender_name}</span>
          </p>
        )}

        {gift?.personal_message && (
          <div
            style={{
              borderLeft: '1px solid var(--loom-rule-warm)',
              paddingLeft: 20,
              marginBottom: 28,
            }}
          >
            <p
              className="loom-body"
              style={{ fontStyle: 'italic', color: 'var(--loom-bone-dim)', fontSize: 15, lineHeight: 1.7, margin: 0 }}
            >
              &ldquo;{gift.personal_message}&rdquo;
            </p>
          </div>
        )}

        {gift?.content && (
          <div
            style={{
              borderTop: '1px solid var(--loom-rule)',
              borderBottom: '1px solid var(--loom-rule)',
              padding: '20px 0',
              marginBottom: 32,
            }}
          >
            <p className="loom-eyebrow" style={{ marginBottom: 8, color: 'var(--loom-warm)' }}>
              {typeLabel}
            </p>
            <p className="loom-body" style={{ fontSize: 18, fontStyle: 'italic', margin: '0 0 6px' }}>
              {gift.content.title}
            </p>
            {gift.content.preview && (
              <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-dim)', margin: 0 }}>
                {gift.content.preview}
              </p>
            )}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="loom-body"
            style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 13, marginBottom: 16 }}
          >
            {error}
          </p>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming}
          className="loom-btn"
          style={{ width: '100%', opacity: claiming ? 0.5 : 1 }}
        >
          {claiming ? 'accepting…' : 'accept this gift'}
        </button>

        <p
          className="loom-mono"
          style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.18em', color: 'var(--loom-bone-faint)', marginTop: 24 }}
        >
          heirloom · preserving what matters
        </p>
      </div>
    </div>
  );
}

export default GiftReceive;
