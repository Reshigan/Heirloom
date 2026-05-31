// FamilyFeed — Loom-native reskin.
// A quiet chronological hairline list of thread additions. No avatars,
// no reactions, no social feed chrome. Each entry is the author's name
// in loom-serif italic + content kind + title.
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { engagementApi } from '../services/api';

interface FeedItem {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  preview: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  reactions: number;
}

const typeVerb: Record<string, string> = {
  memory: 'wove a memory',
  voice: 'recorded a voice',
  letter: 'sealed a letter',
};

const typeKind: Record<string, string> = {
  memory: 'memory',
  voice: 'voice',
  letter: 'letter',
};

export function FamilyFeed() {
  const navigate = useNavigate();

  const { data: feedData, isLoading } = useQuery({
    queryKey: ['family-feed'],
    queryFn: () => engagementApi.getFamilyFeed().then((r) => r.data),
  });

  const items: FeedItem[] = feedData?.items || [];

  return (
    <AppFrame>
      <header style={{ marginBottom: 48 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          the thread · recent additions
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          What the bloodline is weaving.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          Every entry added by your kin, in the order it entered the cloth.
        </p>
      </header>

      <hr className="loom-hairline" style={{ marginBottom: 36 }} />

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : !items.length ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <span
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 28,
              color: 'var(--loom-warm)',
              display: 'block',
              marginBottom: 20,
            }}
          >
            ∞
          </span>
          <h2
            className="loom-serif"
            style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px' }}
          >
            The feed is quiet.
          </h2>
          <p
            className="loom-body"
            style={{ fontSize: 15, color: 'var(--loom-bone-dim)', maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.7 }}
          >
            When your kin add entries — memories, voice, letters — they surface here. Invite them
            to begin their weft.
          </p>
          <button
            type="button"
            onClick={() => navigate('/family')}
            className="loom-btn"
          >
            manage bloodline
          </button>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '96px 1fr auto',
                gap: 24,
                alignItems: 'baseline',
                padding: '20px 0',
                borderBottom: '1px solid var(--loom-rule)',
              }}
            >
              {/* date */}
              <time
                className="loom-mono"
                dateTime={item.created_at}
                style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}
              >
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>

              {/* body */}
              <div>
                <p style={{ margin: 0, lineHeight: 1.3 }}>
                  <span
                    className="loom-serif"
                    style={{ fontSize: 17, fontStyle: 'italic', color: 'var(--loom-bone)' }}
                  >
                    {item.author_name}
                  </span>
                  <span
                    className="loom-body"
                    style={{ fontSize: 14, color: 'var(--loom-bone-dim)', marginLeft: 8 }}
                  >
                    {typeVerb[item.type] ?? 'added an entry'}
                  </span>
                </p>
                <p
                  className="loom-body"
                  style={{ fontSize: 15, color: 'var(--loom-bone)', margin: '6px 0 0', lineHeight: 1.5 }}
                >
                  {item.title}
                </p>
                {item.preview ? (
                  <p
                    className="loom-body"
                    style={{
                      fontSize: 13,
                      color: 'var(--loom-bone-dim)',
                      margin: '4px 0 0',
                      lineHeight: 1.6,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {item.preview}
                  </p>
                ) : null}
              </div>

              {/* kind tag */}
              <span
                className="loom-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--loom-bone-faint)',
                  whiteSpace: 'nowrap',
                }}
              >
                {typeKind[item.type] ?? item.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppFrame>
  );
}

export default FamilyFeed;
