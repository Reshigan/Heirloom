import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { ProgressHair } from '../loom/components/ProgressHair';
import { memorialsApi } from '../services/api';
import { WaxSeal, SectionLabel } from '../loom/cosmic/CosmicUI';

interface MemorialPageData {
  memorial_name: string;
  memorial_description?: string;
  birth_date?: string;
  death_date?: string;
  epitaph?: string;
  tributes?: { id: string; name?: string; message: string }[];
}

export function MemorialPublic() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery<MemorialPageData>({
    queryKey: ['memorial-page', token],
    queryFn: () => memorialsApi.getPage(token!).then((r) => r.data),
    enabled: Boolean(token),
    retry: false,
  });

  const birthYear = data?.birth_date ? new Date(data.birth_date).getFullYear() : null;
  const deathYear = data?.death_date ? new Date(data.death_date).getFullYear() : null;

  return (
    <ClothShell
      topbarLeft={
        <Link
          to="/"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
          }}
        >
          ← heirloom
        </Link>
      }
      topbarCenter={<HLogo size={22} />}
    >
      {/* scroll container */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: 0,
          left: 0,
          right: 0,
          overflowY: 'auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {/* woven seal — centered ceremonial mark behind the page */}
        <picture style={{ display: 'contents' }}>
          <source type="image/avif" srcSet="/woven/seal.avif" />
          <source type="image/webp" srcSet="/woven/seal.webp" />
          <img
            src="/woven/seal.png"
            alt=""
            aria-hidden
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(60vw, 480px)',
              maxWidth: '90%',
              opacity: 0.05,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </picture>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 'var(--page-max-focus)',
            margin: '0 auto',
            width: '100%',
          }}
        >

          {/* ── LOADING ── */}
          {isLoading && <ProgressHair label="loading memorial…" />}

          {/* ── ERROR / NOT FOUND ── */}
          {!isLoading && (isError || !data) && (
            <p
              className="hl-serif hl-italic"
              style={{
                fontSize: 'var(--type-subhead)',
                color: 'var(--bone-dim)',
                lineHeight: 1.7,
                margin: '120px auto 0',
                fontFamily: 'var(--mono)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              this memorial could not be found
            </p>
          )}

          {/* ── SUCCESS ── */}
          {!isLoading && data && (
            <>
              <Helmet>
                {/*
                 * PRIVACY-SAFE share meta. A memorial link is reachable by
                 * anyone holding it, so the scraper-facing tags name no one and
                 * reveal no epitaph. The real name still shows in the on-page
                 * <h1> below — only the og:* / twitter:* / <title> tags that
                 * unfurlers and search crawlers read are kept generic.
                 */}
                <title>A life remembered · Heirloom</title>
                <meta
                  name="description"
                  content="A memorial kept inside a perpetual family thread — permanent, in order, and meant to be carried forward."
                />
                <meta property="og:title" content="A life remembered · Heirloom" />
                <meta
                  property="og:description"
                  content="A memorial kept inside a perpetual family thread — permanent, in order, and meant to be carried forward."
                />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:image" content="https://heirloom.blue/og/milestone.png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="A life remembered · Heirloom" />
                <meta
                  name="twitter:description"
                  content="A memorial kept inside a perpetual family thread — permanent, in order, and meant to be carried forward."
                />
                <meta name="twitter:image" content="https://heirloom.blue/og/milestone.png" />
                <link rel="canonical" href={window.location.href} />
              </Helmet>
              {/*
               * CARE / ceremony archetype:
               * centered composition, generous negative space — no dye
               * left-margin thread (that reads as a list/reading signal).
               * No avatar circle, no borderRadius:'50%'.
               */}
              <div
                className="hl-fadeup"
                style={{
                  textAlign: 'center',
                  marginTop: 64,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* IN MEMORY — mono copper eyebrow */}
                <p
                  className="hl-mono"
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'var(--copper-label)',
                    margin: '0 0 28px',
                    lineHeight: 1,
                  }}
                >
                  in memory
                </p>

                {/* Name — Cormorant display hero (≥24px) */}
                <h1
                  className="hl-serif"
                  style={{
                    fontFamily: 'var(--serif-display)',
                    fontSize: 'clamp(30px, 6vw, 44px)',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: 'var(--bone)',
                    margin: '0 0 16px',
                    lineHeight: 1.1,
                  }}
                >
                  {data.memorial_name}
                </h1>

                {/* Years — mono warm subline */}
                {(birthYear || deathYear) && (
                  <p
                    className="hl-mono"
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 12,
                      letterSpacing: '0.26em',
                      textTransform: 'uppercase',
                      color: 'var(--warm)',
                      margin: '0 0 36px',
                      lineHeight: 1,
                    }}
                  >
                    {`${birthYear ?? '—'} — ${deathYear ?? '—'}`}
                  </p>
                )}

                {/* Epitaph — serif italic dim, centered */}
                {data.epitaph && (
                  <p
                    className="hl-serif hl-italic"
                    style={{
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      fontSize: 'var(--type-body-lg)',
                      color: 'var(--bone-dim)',
                      lineHeight: 1.75,
                      margin: '0 auto 40px',
                      maxWidth: '38ch',
                      textAlign: 'center',
                    }}
                  >
                    {data.epitaph}
                  </p>
                )}

                {/* Hairline rule — centered */}
                <div
                  style={{
                    height: 1,
                    background: 'var(--rule)',
                    margin: '0 auto 40px',
                    width: 120,
                  }}
                />

                {/* Description / biography — serif reading block, centered column */}
                {data.memorial_description && (
                  <p
                    className="hl-serif"
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 18,
                      color: 'var(--bone)',
                      lineHeight: 1.75,
                      margin: '0 auto 8px',
                      maxWidth: '58ch',
                      textAlign: 'left',
                    }}
                  >
                    {data.memorial_description}
                  </p>
                )}
              </div>

              {/* ── Tributes — hairline-ruled list ── */}
              {data.tributes && data.tributes.length > 0 && (
                <div style={{ marginTop: 80, maxWidth: '58ch', marginLeft: 'auto', marginRight: 'auto' }}>
                  <div style={{ textAlign: 'center' }}>
                    <SectionLabel>remembered moments</SectionLabel>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    {data.tributes.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '24px 0',
                          borderBottom: '1px solid var(--rule)',
                          textAlign: 'center',
                        }}
                      >
                        {t.name && (
                          <p
                            className="hl-mono"
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 10,
                              letterSpacing: '0.22em',
                              textTransform: 'uppercase',
                              color: 'var(--bone-faint)',
                              margin: '0 0 10px',
                            }}
                          >
                            {t.name}
                          </p>
                        )}
                        <p
                          className="hl-serif hl-italic"
                          style={{
                            fontFamily: 'var(--serif)',
                            fontStyle: 'italic',
                            fontSize: 'var(--type-body)',
                            color: 'var(--bone-dim)',
                            lineHeight: 1.75,
                            margin: '0 auto',
                            textAlign: 'center',
                            maxWidth: '48ch',
                          }}
                        >
                          {t.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WaxSeal foot — centered */}
              <div
                style={{
                  marginTop: 96,
                  paddingBottom: 24,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <WaxSeal size={28} />
              </div>
            </>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
