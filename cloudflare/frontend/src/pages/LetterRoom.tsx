import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { CosmicHeader, WaxSeal, SectionLabel, WarmDot } from '../loom/cosmic/CosmicUI';
import { lettersApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { dyeColor } from '../loom/dye';
import { type Letter } from '../types';

function statusLabel(letter: Letter): string {
  if (!letter.sealedAt) return 'draft';
  return 'sealed';
}

/** The year a sealed letter opens, or its scheduled/created year as a fallback. */
function letterYear(letter: Letter): string {
  const src = letter.scheduledDate || letter.sealedAt || letter.createdAt || letter.created_at;
  if (!src) return '';
  const d = new Date(src);
  return Number.isNaN(d.getTime()) ? '' : String(d.getFullYear());
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
        <CosmicHeader
          eyebrow={`${letters.length} ${letters.length === 1 ? 'letter' : 'letters'}`}
          title="Letters waiting to be read."
        />

        {/* CTA — seal a new letter */}
        <Link
          to="/loom/compose-letter"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginBottom: 32, textDecoration: 'none',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.26em',
            textTransform: 'uppercase', color: 'var(--warm)',
          }}
        >
          seal a new letter
          <span aria-hidden>→</span>
        </Link>

        {/* Empty state — quiet serif-italic line */}
        {!isLoading && letters.length === 0 && (
          <div style={{ paddingTop: 48 }}>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 19, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--bone-dim)', lineHeight: 1.7, margin: '0 0 4px',
            }}>
              There is someone who needs to read this.
            </p>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 19, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: 0,
            }}>
              Just not yet.
            </p>
          </div>
        )}

        {/* Letters */}
        {letters.length > 0 && (
          <>
            <SectionLabel>The Letters</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {letters.map((letter) => {
                const dye = dyeColor(letter.id, letter.metadata);
                const recipientName = letter.recipients?.[0]?.name ?? null;
                const isExpanded = expandedId === letter.id;
                const status = statusLabel(letter);
                const isSealed = !!letter.sealedAt;
                const year = letterYear(letter);
                const headline = letter.salutation || letter.title || 'A letter';
                const author = recipientName ? recipientName.toUpperCase() : 'THE FAMILY';

                return (
                  <article
                    key={letter.id}
                    id={`letter-${letter.id}`}
                    style={{
                      borderLeft: `3px solid ${dye}`,
                      borderBottom: '1px solid var(--rule)',
                      paddingLeft: 24,
                      paddingRight: 4,
                      paddingTop: 22,
                      paddingBottom: 24,
                      transition: `background 180ms ${EASE}`,
                    }}
                  >
                    {/* Header row — serif headline + mono affordances */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 style={{
                          fontFamily: 'var(--serif)', fontSize: 'clamp(24px,5vw,34px)',
                          fontWeight: 400, color: 'var(--bone)', lineHeight: 1.12,
                          letterSpacing: '-0.01em', margin: 0,
                        }}>
                          {headline}
                        </h2>
                        <div style={{
                          marginTop: 10, display: 'flex', alignItems: 'center', gap: 9,
                          flexWrap: 'wrap',
                          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.26em',
                          textTransform: 'uppercase', color: 'var(--warm)',
                        }}>
                          {isSealed ? (
                            <span>sealed{year ? ` · opens ${year}` : ''}</span>
                          ) : (
                            <>
                              <WarmDot color={dye} size={5} />
                              <span style={{ color: 'var(--warm)' }}>
                                a letter by {author}{year ? ` · ${year}` : ''}
                              </span>
                            </>
                          )}
                          <span style={{ color: 'var(--bone-faint)', letterSpacing: '0.18em' }}>
                            · {recipientName ? `to ${recipientName}` : 'no recipient'} · {status}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedId(isExpanded ? null : letter.id)}
                          style={{
                            background: 'transparent', border: 0,
                            padding: '12px 0', minHeight: 44,
                            display: 'inline-flex', alignItems: 'center',
                            cursor: 'pointer',
                            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: 'var(--bone-dim)',
                          }}
                        >
                          {isExpanded ? 'close' : 'read'}
                        </button>
                        {!isSealed && (
                          <Link
                            to={`/loom/compose-letter?id=${letter.id}`}
                            style={{
                              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
                              textTransform: 'uppercase', color: 'var(--warm-dim)',
                              textDecoration: 'none',
                              padding: '12px 0', minHeight: 44,
                              display: 'inline-flex', alignItems: 'center',
                            }}
                          >
                            edit
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Expanded reading view */}
                    {isExpanded && (
                      isSealed ? (
                        // Ceremony-style sealed state — glowing ∞, no body
                        <div
                          style={{
                            marginTop: 28, paddingTop: 28, paddingBottom: 12,
                            borderTop: '1px solid var(--rule)',
                            textAlign: 'center',
                            animation: `hl-fade 360ms ${EASE}`,
                          }}
                        >
                          <div aria-hidden style={{
                            color: 'var(--warm)', fontSize: 'clamp(40px,10vw,64px)', lineHeight: 1,
                            textShadow: '0 0 32px var(--warm-glow), 0 0 12px var(--warm-glow)',
                          }}>
                            ∞
                          </div>
                          <div style={{
                            marginTop: 18,
                            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.26em',
                            textTransform: 'uppercase', color: 'var(--warm)',
                          }}>
                            sealed{year ? ` · opens ${year}` : ''}
                          </div>
                          <p style={{
                            fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
                            fontSize: 17, color: 'var(--bone-dim)', lineHeight: 1.6,
                            margin: '14px auto 0', maxWidth: '28em',
                          }}>
                            This letter is sealed. Its words will keep until the day they are meant to be read.
                          </p>
                        </div>
                      ) : (
                        // Reading recipe — justified serif body
                        <div
                          style={{
                            marginTop: 24, paddingTop: 24,
                            borderTop: '1px solid var(--rule)',
                            animation: `hl-fade 360ms ${EASE}`,
                          }}
                        >
                          <p style={{
                            fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 300,
                            color: 'var(--bone)', lineHeight: 1.75, margin: '0 auto',
                            maxWidth: '62ch', textAlign: 'justify', whiteSpace: 'pre-wrap',
                          }}>
                            {fullBodies[letter.id] || letter.bodyPreview}
                          </p>
                          {letter.signature && (
                            <p style={{
                              fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
                              fontSize: 18, color: 'var(--bone-dim)', lineHeight: 1.75,
                              margin: '24px auto 0', maxWidth: '62ch',
                            }}>
                              {letter.signature}
                            </p>
                          )}
                          <div style={{ marginTop: 36 }}>
                            <WaxSeal size={26} />
                          </div>
                        </div>
                      )
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* Page foot seal */}
        {letters.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <WaxSeal />
          </div>
        )}
      </div>
    </ClothShell>
  );
}
