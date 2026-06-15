import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { RoomHeader } from '../loom/components/room';
import { UserMenu } from '../loom/components/Frame';
import { lettersApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeColor } from '../loom/dye';
import { type Letter } from '../types';

function statusLabel(letter: Letter): string {
  if (!letter.sealedAt) return 'draft';
  return 'sealed';
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

export function LetterRoom() {
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const wantId = searchParams.get('id');
  const [expandedId, setExpandedId] = useState<string | null>(wantId);
  const [fullBodies, setFullBodies] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['letters'],
    queryFn: () => lettersApi.getAll({ limit: 200 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const letters: Letter[] = (data as { data: Letter[] } | null)?.data ?? [];

  // A letter tapped on the cloth arrives as ?id=<id> — open it and bring it
  // into view once the list has rendered.
  useEffect(() => {
    if (!wantId || letters.length === 0) return;
    setExpandedId(wantId);
    const el = document.getElementById(`letter-${wantId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [wantId, letters.length]);

  // Fetch full body when a letter is expanded
  useEffect(() => {
    if (!expandedId) return;
    if (fullBodies[expandedId]) return; // already fetched
    lettersApi.getOne(expandedId)
      .then((r) => {
        const body = r.data?.body ?? '';
        if (body) setFullBodies((prev) => ({ ...prev, [expandedId]: body }));
      })
      .catch(() => {
        // silently fall back to bodyPreview
      });
  }, [expandedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const topbarLeft = (
    <Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'letters' }]} />
  );

  return (
    <ClothShell topbarLeft={topbarLeft} topbarRight={<UserMenu />}>
      {/* Hairline loading bar */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 1,
          background: 'var(--warm)', opacity: isLoading ? 0.6 : 0,
          transition: 'opacity 360ms', zIndex: 30, pointerEvents: 'none',
        }}
      />

      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', maxWidth: 'var(--page-max-prose)', margin: '0 auto' }}>
        <RoomHeader
          eyebrow="the letters"
          title="Letters waiting to be read."
          className="hl-room-header"
        />
        <style>{`.hl-room-header { margin-bottom: 32px; }`}</style>

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
            const dye = dyeColor(letter.id, letter.metadata);
            const recipientName = letter.recipients?.[0]?.name ?? null;
            const isExpanded = expandedId === letter.id;
            const status = statusLabel(letter);
            const isSealed = !!letter.sealedAt;

            return (
              <div
                key={letter.id}
                id={`letter-${letter.id}`}
                style={{
                  borderLeft: `3px solid ${dye}`,
                  borderBottom: '1px solid var(--rule)',
                  padding: '20px 14px',
                  transition: `background 180ms ${EASE}`,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'var(--serif)', fontSize: 'var(--type-subhead)', fontWeight: 300,
                      color: 'var(--bone)', lineHeight: 1.3, margin: 0,
                    }}>
                      {letter.salutation || letter.title}
                    </p>
                    <span style={{
                      display: 'block', marginTop: 6,
                      fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: 'var(--bone-faint)',
                    }}>
                      {recipientName ? `to: ${recipientName}` : 'no recipient'} · {status}
                      {letter.scheduledDate ? ` · ${new Date(letter.scheduledDate).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
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
                        textTransform: 'uppercase', color: 'var(--bone-faint)',
                        borderBottom: '1px solid var(--bone-faint)',
                      }}
                    >
                      {isExpanded ? 'close' : 'read'}
                    </button>
                    {!isSealed && (
                      <Link
                        to={`/loom/compose-letter?id=${letter.id}`}
                        style={{
                          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                          textTransform: 'uppercase', color: 'var(--warm-dim)',
                          textDecoration: 'none', borderBottom: '1px solid var(--warm-dim)',
                          padding: '12px 6px', minHeight: 44,
                          display: 'inline-flex', alignItems: 'center',
                        }}
                      >
                        edit
                      </Link>
                    )}
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12, paddingTop: 12,
                      borderTop: '1px solid var(--rule)',
                      animation: `hl-fade 360ms ${EASE}`,
                    }}
                  >
                    <p style={{
                      fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 300,
                      color: 'var(--bone-dim)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap',
                    }}>
                      {fullBodies[letter.id] || letter.bodyPreview}
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
