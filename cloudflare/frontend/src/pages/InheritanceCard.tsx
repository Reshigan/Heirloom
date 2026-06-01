import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

async function fetchInheritance(_token: string) {
  return {
    threadName: 'The Okonkwo Thread',
    authorName: 'Emeka Okonkwo',
    entryCount: 4318,
    yearStarted: 1948,
  };
}

export function InheritanceCard() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['inheritance', token],
    queryFn: () => fetchInheritance(token!),
    enabled: !!token,
  });

  const [unlocked, setUnlocked] = useState(false);

  if (isLoading) {
    return (
      <div className="hl-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <progress style={{ width: 120, height: 1, appearance: 'none', accentColor: 'var(--warm)' }} />
      </div>
    );
  }

  return (
    <div className="hl-screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 24 }}>inheritance</div>

        <h1 className="hl-serif hl-tight" style={{ fontSize: 36, fontWeight: 300, color: 'var(--bone)', margin: '0 0 16px' }}>
          {data?.threadName}
        </h1>

        <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone-dim)', lineHeight: 1.6, margin: '0 0 8px' }}>
          started by {data?.authorName} in {data?.yearStarted}
        </p>

        <p className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 48px' }}>
          {data?.entryCount?.toLocaleString()} entries
        </p>

        <hr style={{ border: 0, borderTop: '1px solid var(--rule)', margin: '0 0 48px' }} />

        {!unlocked ? (
          <button
            type="button"
            className="hl-btn"
            onClick={() => setUnlocked(true)}
            style={{ fontSize: 16, padding: '18px 40px' }}
          >
            ∞ open the thread
          </button>
        ) : (
          <div style={{ animation: 'fadeIn var(--dur-slow) var(--ease) forwards' }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
            <p className="hl-serif" style={{ fontSize: 18, color: 'var(--bone)', lineHeight: 1.7 }}>
              The thread is open. Create your account to read and contribute.
            </p>
            <a href="/signup" className="hl-btn" style={{ display: 'inline-block', marginTop: 24 }}>
              Join the thread →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
