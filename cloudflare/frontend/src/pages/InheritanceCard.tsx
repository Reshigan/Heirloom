import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { ProgressHair } from '../loom/components/ProgressHair';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeForId } from '../loom/dye';

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

  // Deterministic dye from token for the margin thread
  const threadColor = token ? `var(--dye-${dyeForId(token)})` : 'var(--rule)';

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
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--copper-label)', margin: 0 }}>
            this inheritance link is invalid or has expired
          </p>
        </div>
      </ClothShell>
    );
  }

  return (
    <ClothShell topbarLeft={topbar} topbarCenter="inheritance">
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {/* Woven seal — ceremonial backdrop, behind content */}
        <picture style={{ display: 'contents' }}>
          <source type="image/avif" srcSet="/woven/seal.avif" />
          <source type="image/webp" srcSet="/woven/seal.webp" />
          <img
            src="/woven/seal.png"
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(560px, 90vw)',
              maxWidth: '90vw',
              opacity: 0.07,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </picture>

        {/* Centered ceremonial card with top dye thread */}
        <div
          style={{
            position: 'relative',
            maxWidth: '54ch',
            width: '100%',
            textAlign: 'center',
            borderTop: `3px solid ${threadColor}`,
            paddingTop: 40,
          }}
        >
          {/* Mono warm subline eyebrow */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
              marginBottom: 20,
            }}
          >
            {data?.recipientName
              ? `FOR ${data.recipientName}${data.relationship ? ` · ${data.relationship.toUpperCase()}` : ''}`
              : 'AN INHERITANCE'}
          </div>

          {/* Display headline — the owner's name */}
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(32px, 6vw, 48px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'var(--bone)',
              margin: '0 0 16px',
            }}
          >
            {data?.ownerName}
          </h1>

          {/* Mono subline — "AN INHERITANCE" label */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--muted-2)',
              marginBottom: 56,
            }}
          >
            AN INHERITANCE
          </div>

          {/* Body / action area */}
          {!unlocked ? (
            <div>
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 18,
                  lineHeight: 1.8,
                  color: 'var(--bone)',
                  margin: '0 auto 44px',
                  maxWidth: '46ch',
                }}
              >
                A thread has been woven for you — generations of memory, voice, and story passed down through the bloodline. To read and contribute, open the thread.
              </p>
              <button
                type="button"
                onClick={() => setUnlocked(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'var(--copper-label)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 44,
                }}
              >
                ∞ open the thread
              </button>
            </div>
          ) : (
            <div
              style={{
                animation: 'hl-fadeIn var(--dur-slow) var(--ease) forwards',
              }}
            >
              <style>{`@keyframes hl-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 18,
                  lineHeight: 1.8,
                  color: 'var(--bone)',
                  margin: '0 auto 44px',
                  maxWidth: '46ch',
                }}
              >
                The thread is open. Create your account to read and contribute.
              </p>
              <Link
                to={`/signup?inheritToken=${data?.sessionToken}&source=inheritance`}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'var(--copper-label)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 44,
                }}
              >
                JOIN THE THREAD →
              </Link>
            </div>
          )}
        </div>

        {/* WaxSeal foot */}
        <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 64 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </ClothShell>
  );
}
