import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../components/ClothShell';
import { lettersApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const DYE_HEX: Record<string, string> = {
  madder: '#e84030', cochineal: '#d42868', kermes: '#f05268',
  saffron: '#f5c832', weld: '#edae2e', walnut: '#a07040',
  oakgall: '#7c5c4a', woad: '#4898d8', indigo: '#3878e8', iron: '#4a4a46',
};
const DYE_KEYS = Object.keys(DYE_HEX);

function dyeFor(id: string): string {
  const h = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  return DYE_HEX[DYE_KEYS[Math.abs(h) % DYE_KEYS.length]];
}

function statusLabel(letter: Letter): string {
  if (!letter.sealedAt) return 'draft';
  return 'sealed';
}

interface Letter {
  id: string;
  title: string;
  salutation: string | null;
  bodyPreview: string;
  signature: string | null;
  deliveryTrigger: string;
  scheduledDate: string | null;
  sealedAt: string | null;
  recipients: Array<{ id: string; name: string; relationship: string }>;
  createdAt: string;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

export function LetterRoom() {
  const { isAuthenticated } = useAuthStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['letters'],
    queryFn: () => lettersApi.getAll({ limit: 200 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const letters: Letter[] = (data as { data: Letter[] } | null)?.data ?? [];

  const topbarLeft = (
    <Link
      to="/loom/weft"
      style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none',
      }}
    >
      ← cloth
    </Link>
  );

  return (
    <ClothShell topbarLeft={topbarLeft} topbarCenter="letters">
      {/* Hairline loading bar */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 1,
          background: 'var(--warm)', opacity: isLoading ? 0.6 : 0,
          transition: 'opacity 360ms', zIndex: 30, pointerEvents: 'none',
        }}
      />

      <div style={{ padding: 'clamp(24px, 5vw, 48px)', paddingBottom: 120, maxWidth: 680 }}>
        {/* CTA */}
        <Link
          to="/loom/compose-letter"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderLeft: '3px solid var(--warm)', padding: '10px 14px',
            marginBottom: 28, textDecoration: 'none',
          }}
        >
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--warm)',
          }}>
            seal a new letter
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)' }}>→</span>
        </Link>

        {/* Empty state */}
        {!isLoading && letters.length === 0 && (
          <div style={{ paddingTop: 40 }}>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: '0 0 4px',
            }}>
              There is someone who needs to read this.
            </p>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: 0,
            }}>
              Just not yet.
            </p>
          </div>
        )}

        {/* Letter list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {letters.map((letter) => {
            const dye = dyeFor(letter.id);
            const recipientName = letter.recipients?.[0]?.name ?? null;
            const isExpanded = expandedId === letter.id;
            const status = statusLabel(letter);

            return (
              <div
                key={letter.id}
                style={{
                  borderLeft: `3px solid ${dye}`,
                  borderBottom: '1px solid rgba(244,236,216,0.06)',
                  padding: '10px 14px',
                  transition: `background 180ms ${EASE}`,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'rgba(244,236,216,0.35)',
                  }}>
                    {recipientName ? `to: ${recipientName}` : 'no recipient'} · {status}
                  </span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId(isExpanded ? null : letter.id)}
                      style={{
                        background: 'transparent', border: 0,
                        padding: '12px 6px', minHeight: 44,
                        display: 'inline-flex', alignItems: 'center',
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                        textTransform: 'uppercase', color: 'rgba(244,236,216,0.4)',
                        borderBottom: '1px solid rgba(244,236,216,0.15)',
                      }}
                    >
                      {isExpanded ? 'close' : 'read'}
                    </button>
                    <Link
                      to={`/loom/compose-letter?id=${letter.id}`}
                      style={{
                        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                        textTransform: 'uppercase', color: 'rgba(176,122,74,0.7)',
                        textDecoration: 'none', borderBottom: '1px solid rgba(176,122,74,0.25)',
                        padding: '12px 6px', minHeight: 44,
                        display: 'inline-flex', alignItems: 'center',
                      }}
                    >
                      edit
                    </Link>
                  </div>
                </div>

                {/* Title */}
                <p style={{
                  fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                  fontWeight: 300, color: 'rgba(244,236,216,0.55)', lineHeight: 1.5, margin: '4px 0 0',
                }}>
                  {letter.salutation || letter.title}
                </p>

                {/* Delivery metadata */}
                {letter.scheduledDate && (
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'rgba(244,236,216,0.2)',
                    display: 'block', marginTop: 3,
                  }}>
                    delivery: {new Date(letter.scheduledDate).toLocaleDateString()}
                  </span>
                )}

                {/* Expanded body */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12, paddingTop: 12,
                      borderTop: '1px solid rgba(244,236,216,0.08)',
                      animation: `hl-fade 360ms ${EASE}`,
                    }}
                  >
                    <p style={{
                      fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 300,
                      color: 'var(--bone-dim)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap',
                    }}>
                      {letter.bodyPreview}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ClothShell>
  );
}
