import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { SectionLabel, WarmDot } from '../loom/cosmic/CosmicUI';
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

/**
 * The ceremony title that reads "<Name>, on your <occasion>" — the occasion
 * is the letter's milestone / delivery trigger, falling back to the open year.
 */
function letterTitle(letter: Letter): string {
  const name = letter.recipients?.[0]?.name?.trim();
  const occasion = (letter.milestoneLabel || letter.deliveryTrigger || '').trim();
  if (name && occasion) return `${name}, on your ${occasion.toLowerCase()}`;
  if (name) return name;
  return letter.salutation || letter.title || 'A letter';
}

/** The mono "OPENS WHEN <condition>" line for the card foot. */
function opensCondition(letter: Letter): string {
  const occasion = (letter.milestoneLabel || letter.deliveryTrigger || '').trim();
  if (occasion) {
    const name = letter.recipients?.[0]?.name?.trim();
    return name ? `opens when ${name.toLowerCase()} ${occasion.toLowerCase()}` : `opens · ${occasion.toLowerCase()}`;
  }
  const year = letterYear(letter);
  return year ? `opens ${year}` : 'opens when the day comes';
}

import { EASE } from '../loom/motion';

/**
 * Choose the letter the room leads with as a full seal ceremony. We surface the
 * letter that most wants attention right now: the first unsealed DRAFT (so the
 * reader can finish the rite and seal it), and failing that the next letter to
 * open / most recently sealed.
 */
function chooseFeatured(letters: Letter[], wantId: string | null): Letter | null {
  if (letters.length === 0) return null;
  if (wantId) {
    const requested = letters.find((l) => l.id === wantId);
    if (requested) return requested;
  }
  const firstDraft = letters.find((l) => !l.sealedAt);
  if (firstDraft) return firstDraft;

  // No drafts — feature the sealed letter that opens soonest, else the newest.
  const sealed = [...letters].sort((a, b) => {
    const ay = new Date(a.scheduledDate || a.sealedAt || a.createdAt || a.created_at || 0).getTime();
    const by = new Date(b.scheduledDate || b.sealedAt || b.createdAt || b.created_at || 0).getTime();
    return ay - by;
  });
  return sealed[0] ?? letters[0];
}

export function LetterRoom() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const wantId = searchParams.get('id');
  const [expandedId, setExpandedId] = useState<string | null>(wantId);
  const [fullBodies, setFullBodies] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['letters'],
    queryFn: () => lettersApi.getAll({ limit: 200 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  // Seal the letter — the rite that closes its words until the day they open.
  const sealMutation = useMutation({
    mutationFn: (id: string) => lettersApi.seal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
    },
  });

  const letters: Letter[] = (data as { data: Letter[] } | null)?.data ?? [];

  // The featured letter leads the room as a full ceremony; the rest fall to the
  // quiet ledger below. When ?id= points at a letter, that one is featured.
  const featured = chooseFeatured(letters, wantId);
  const rest = featured ? letters.filter((l) => l.id !== featured.id) : letters;

  // A letter tapped on the cloth arrives as ?id=<id> — open it in the ledger and
  // bring it into view once the list has rendered (the featured one is already
  // shown in full at the top, so this is only for ledger rows).
  useEffect(() => {
    if (!wantId || letters.length === 0) return;
    setExpandedId(wantId);
    const el = document.getElementById(`letter-${wantId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [wantId, letters.length]);

  // Fetch full body for the featured ceremony and any expanded ledger letter.
  useEffect(() => {
    const ids = [featured?.id, expandedId].filter((id): id is string => !!id && !fullBodies[id]);
    if (ids.length === 0) return;
    for (const id of ids) {
      lettersApi.getOne(id)
        .then((r) => {
          const body = r.data?.body ?? '';
          if (body) setFullBodies((prev) => ({ ...prev, [id]: body }));
        })
        .catch(() => {
          // silently fall back to bodyPreview
        });
    }
  }, [featured?.id, expandedId]); // eslint-disable-line react-hooks/exhaustive-deps

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
          transition: `opacity 360ms ${EASE}`, zIndex: 30, pointerEvents: 'none',
        }}
      />

      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', maxWidth: 'var(--page-max-prose)', margin: '0 auto' }}>
        {/* Empty state — the ceremony framing inviting the first letter. */}
        {!isLoading && !featured && (
          <div style={{ textAlign: 'center', paddingTop: 'clamp(24px,8vh,72px)' }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.32em',
              textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 16,
            }}>
              a letter to
            </div>
            <h1 style={{
              fontFamily: 'var(--serif)', fontWeight: 380,
              fontSize: 'clamp(30px,7vw,52px)', lineHeight: 1.06,
              letterSpacing: '-0.012em', color: 'var(--bone)',
              margin: '0 auto', maxWidth: '12em',
            }}>
              Someone who isn’t ready to read it yet.
            </h1>
            <p style={{
              fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
              fontSize: 18, color: 'var(--bone-dim)', lineHeight: 1.7,
              margin: '24px auto 0', maxWidth: '26em',
            }}>
              A sealed letter waits across years for the day it is meant to open.
              Write the first.
            </p>
            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
              <Link
                to="/loom/compose-letter"
                className="hl-btn"
              >
                write a letter
              </Link>
            </div>
          </div>
        )}

        {/* The featured letter — led as the full seal ceremony. */}
        {featured && (() => {
          const isSealed = !!featured.sealedAt;
          const body = fullBodies[featured.id] || featured.bodyPreview || '';

          return (
            <section style={{ textAlign: 'center', animation: `hl-fade 360ms ${EASE}` }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.32em',
                textTransform: 'uppercase', color: 'var(--copper-label)', marginBottom: 16,
              }}>
                a letter to
              </div>
              <h1 style={{
                fontFamily: 'var(--serif)', fontWeight: 380,
                fontSize: 'clamp(30px,7vw,52px)', lineHeight: 1.06,
                letterSpacing: '-0.012em', color: 'var(--bone)',
                margin: '0 auto 32px', maxWidth: '13em',
              }}>
                {letterTitle(featured)}
              </h1>

              {/* The glowing letter card — warm-edged glow, ink fill. This IS the
                  content; sealed letters show a quiet kept-words line instead. */}
              <div style={{
                border: '1px solid var(--warm-dim)',
                borderRadius: 0,
                padding: 'clamp(24px,6vw,44px)',
                background: 'var(--bg-letter)',
                boxShadow: '0 0 34px rgba(216,150,84,0.42), inset 0 0 0 1px rgba(216,150,84,0.25)',
                maxWidth: '38em', margin: '0 auto', textAlign: 'left',
              }}>
                {isSealed && !body ? (
                  <p style={{
                    fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
                    fontSize: 18, color: 'var(--bone-dim)', lineHeight: 1.75,
                    margin: 0, textAlign: 'center',
                  }}>
                    This letter is sealed. Its words will keep until the day they are
                    meant to be read.
                  </p>
                ) : (
                  <>
                    <p style={{
                      fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 300,
                      color: '#d8c7aa', lineHeight: 1.85, margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {body}
                    </p>
                    {featured.signature && (
                      <p style={{
                        fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
                        fontSize: 18, color: 'var(--bone-dim)', lineHeight: 1.75,
                        margin: '24px 0 0',
                      }}>
                        {featured.signature}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Foot of the ceremony — wax seal at left, the rite pill at right. */}
              <div style={{
                marginTop: 28, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 18, flexWrap: 'wrap',
              }}>
                <picture style={{ display: 'contents' }}>
                  <source type="image/avif" srcSet="/woven/seal.avif" />
                  <source type="image/webp" srcSet="/woven/seal.webp" />
                  <img src="/woven/seal.png" width="54" height="54" alt="" aria-hidden />
                </picture>
                {isSealed ? (
                  <Link
                    to={`/loom/compose-letter?id=${featured.id}`}
                    aria-disabled
                    onClick={(e) => e.preventDefault()}
                    style={{
                      border: '1px solid var(--copper-border)', borderRadius: 0,
                      color: 'var(--gold-text)', textDecoration: 'none',
                      fontFamily: 'var(--mono)', fontSize: 11,
                      letterSpacing: '0.26em', textTransform: 'uppercase',
                      padding: '12px 26px', cursor: 'default',
                    }}
                  >
                    sealed
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={sealMutation.isPending}
                    onClick={() => sealMutation.mutate(featured.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--copper-border)',
                      borderRadius: 0,
                      color: 'var(--gold-text)',
                      fontFamily: 'var(--mono)', fontSize: 11,
                      letterSpacing: '0.26em', textTransform: 'uppercase',
                      padding: '12px 26px',
                      cursor: sealMutation.isPending ? 'default' : 'pointer',
                      opacity: sealMutation.isPending ? 0.5 : 1,
                      transition: `opacity 180ms ${EASE}`,
                    }}
                  >
                    {sealMutation.isPending ? 'sealing…' : 'seal this letter'}
                  </button>
                )}
              </div>

              {/* The quiet open-condition line. */}
              <div style={{
                marginTop: 16,
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: 'var(--bone-faint)',
              }}>
                {opensCondition(featured)}
              </div>

              {/* Quiet affordance to keep editing a featured draft. */}
              {!isSealed && (
                <div style={{ marginTop: 18 }}>
                  <Link
                    to={`/loom/compose-letter?id=${featured.id}`}
                    style={{
                      fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
                      textTransform: 'uppercase', color: 'var(--warm-dim)',
                      textDecoration: 'none',
                    }}
                  >
                    edit this letter
                  </Link>
                </div>
              )}
            </section>
          );
        })()}

        {/* The rest of the letters — a quiet ledger below the ceremony. */}
        {rest.length > 0 && (
          <div style={{ marginTop: 'clamp(48px,10vh,88px)' }}>
            <SectionLabel>The Letters</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rest.map((letter) => {
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
                          fontFamily: 'var(--serif)', fontSize: 'clamp(22px,4vw,30px)',
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
                          <picture style={{ display: 'contents' }}>
                  <source type="image/avif" srcSet="/woven/seal.avif" />
                  <source type="image/webp" srcSet="/woven/seal.webp" />
                  <img src="/woven/seal.png" width="54" height="54" alt="" aria-hidden />
                </picture>
                          <div style={{
                            marginTop: 18,
                            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.26em',
                            textTransform: 'uppercase', color: 'var(--copper-label)',
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
                        // The ceremony — "A LETTER TO" eyebrow, serif title, the
                        // glowing letter card, then the wax seal + SEAL THIS LETTER rite.
                        <div
                          style={{
                            marginTop: 28, paddingTop: 28,
                            borderTop: '1px solid var(--rule)',
                            animation: `hl-fade 360ms ${EASE}`,
                          }}
                        >
                          <div style={{
                            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.32em',
                            textTransform: 'uppercase', color: 'var(--copper-label)',
                            textAlign: 'center', marginBottom: 14,
                          }}>
                            a letter to
                          </div>
                          <h3 style={{
                            fontFamily: 'var(--serif)', fontWeight: 380,
                            fontSize: 'clamp(28px,6vw,40px)', lineHeight: 1.08,
                            letterSpacing: '-0.012em', color: 'var(--bone)',
                            textAlign: 'center', margin: '0 auto 30px', maxWidth: '14em',
                          }}>
                            {letterTitle(letter)}
                          </h3>

                          {/* The glowing letter card — this card IS the content. */}
                          <div style={{
                            border: '1px solid var(--warm-dim)',
                            borderRadius: 0,
                            padding: 'clamp(24px,6vw,40px)',
                            background: 'var(--bg-letter)',
                            boxShadow: '0 0 34px rgba(216,150,84,0.42), inset 0 0 0 1px rgba(216,150,84,0.25)',
                            maxWidth: '38em', margin: '0 auto',
                          }}>
                            <p style={{
                              fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 300,
                              color: '#d8c7aa', lineHeight: 1.85, margin: 0,
                              whiteSpace: 'pre-wrap',
                            }}>
                              {fullBodies[letter.id] || letter.bodyPreview}
                            </p>
                            {letter.signature && (
                              <p style={{
                                fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
                                fontSize: 18, color: 'var(--bone-dim)', lineHeight: 1.75,
                                margin: '24px 0 0',
                              }}>
                                {letter.signature}
                              </p>
                            )}
                          </div>

                          {/* Wax-seal dot + SEAL THIS LETTER pill, OPENS WHEN beneath. */}
                          <div style={{
                            marginTop: 28, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 18, flexWrap: 'wrap',
                          }}>
                            <picture style={{ display: 'contents' }}>
                  <source type="image/avif" srcSet="/woven/seal.avif" />
                  <source type="image/webp" srcSet="/woven/seal.webp" />
                  <img src="/woven/seal.png" width="54" height="54" alt="" aria-hidden />
                </picture>
                            <button
                              type="button"
                              disabled={sealMutation.isPending}
                              onClick={() => sealMutation.mutate(letter.id)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--copper-border)',
                                borderRadius: 0,
                                color: 'var(--gold-text)',
                                fontFamily: 'var(--mono)', fontSize: 11,
                                letterSpacing: '0.26em', textTransform: 'uppercase',
                                padding: '12px 26px',
                                cursor: sealMutation.isPending ? 'default' : 'pointer',
                                opacity: sealMutation.isPending ? 0.5 : 1,
                                transition: `opacity 180ms ${EASE}`,
                              }}
                            >
                              {sealMutation.isPending ? 'sealing…' : 'seal this letter'}
                            </button>
                          </div>
                          <div style={{
                            marginTop: 16, textAlign: 'center',
                            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.24em',
                            textTransform: 'uppercase', color: 'var(--bone-faint)',
                          }}>
                            {opensCondition(letter)}
                          </div>
                        </div>
                      )
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Page foot — quiet "seal a new letter" affordance. */}
        {featured && (
          <div style={{ marginTop: 56, textAlign: 'center' }}>
            <Link
              to="/loom/compose-letter"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                textDecoration: 'none',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.26em',
                textTransform: 'uppercase', color: 'var(--warm)',
              }}
            >
              seal a new letter
              <span aria-hidden>→</span>
            </Link>
          </div>
        )}
      </div>
    </ClothShell>
  );
}
