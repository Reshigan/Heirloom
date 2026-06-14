import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { ProgressHair } from '../loom/components/ProgressHair';

async function fetchInheritance(token: string) {
  // Validate the token and get recipient/owner info from the worker inherit route.
  // GET /api/inherit/:token → { sessionToken, recipient: { name, relationship }, owner: { name } }
  const { data } = await api.get(`/inherit/${token}`);
  return {
    ownerName: (data.owner?.name ?? 'Unknown') as string,
    recipientName: (data.recipient?.name ?? '') as string,
    relationship: (data.recipient?.relationship ?? '') as string,
    sessionToken: data.sessionToken as string,
  };
}

export function InheritanceCard() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['inheritance', token],
    queryFn: () => fetchInheritance(token!),
    enabled: !!token,
  });

  const [unlocked, setUnlocked] = useState(false);

  const topbar = <HLogo size={18} wordmark mono color="var(--bone-dim)" wordColor="var(--bone-dim)" glow={false} />;

  if (isLoading) {
    return (
      <ClothShell topbarLeft={topbar} topbarCenter="inheritance">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <ProgressHair width={120} />
        </div>
      </ClothShell>
    );
  }

  if (isError) {
    return (
      <ClothShell topbarLeft={topbar} topbarCenter="inheritance">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p className="hl-serif" style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--bone-dim)' }}>
            This inheritance link is invalid or has expired.
          </p>
        </div>
      </ClothShell>
    );
  }

  return (
    <ClothShell topbarLeft={topbar} topbarCenter="inheritance">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)' }}>
        <div style={{ maxWidth: 'var(--page-max-focus)', width: '100%', textAlign: 'center' }}>
          <h1 className="hl-serif hl-tight" style={{ fontSize: 'var(--type-title)', fontWeight: 300, color: 'var(--bone)', margin: '0 0 16px' }}>
            {data?.ownerName}
          </h1>

          {data?.recipientName && (
            <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone-dim)', lineHeight: 1.6, margin: '0 0 8px' }}>
              for {data.recipientName}
              {data.relationship ? ` · ${data.relationship}` : ''}
            </p>
          )}

          <hr className="hl-rule" style={{ margin: '0 0 48px' }} />

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
            <div style={{ animation: 'hl-fadeIn var(--dur-slow) var(--ease) forwards' }}>
              <style>{`@keyframes hl-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
              <p className="hl-serif" style={{ fontSize: 18, color: 'var(--bone)', lineHeight: 1.7 }}>
                The thread is open. Create your account to read and contribute.
              </p>
              <Link to={`/signup?inheritToken=${data?.sessionToken}&source=inheritance`} className="hl-btn" style={{ display: 'inline-block', marginTop: 24 }}>
                Join the thread →
              </Link>
            </div>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
