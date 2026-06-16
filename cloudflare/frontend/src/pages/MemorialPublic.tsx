import { useParams, Link } from 'react-router-dom';
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
        <div style={{ maxWidth: 'var(--page-max-focus)', margin: '0 auto', width: '100%' }}>

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
                margin: '80px 0 0',
                fontFamily: 'var(--mono)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              this memorial could not be found
            </p>
          )}

          {/* ── SUCCESS ── */}
          {!isLoading && data && (
            <>
              {/*
               * READING archetype:
               * dye left-margin thread (3px warm solid) + paddingLeft: 24
               * gives the reading column its identity signal.
               * No avatar circle, no borderRadius:'50%'.
               */}
              <div
                style={{
                  borderLeft: '3px solid var(--warm)',
                  paddingLeft: 24,
                  marginTop: 8,
                }}
              >
                {/* Name — serif headline */}
                <h1
                  className="hl-serif"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 'clamp(30px, 6vw, 44px)',
                    fontWeight: 400,
                    fontVariationSettings: '"opsz" 32',
                    letterSpacing: '-0.01em',
                    color: 'var(--bone)',
                    margin: '0 0 12px',
                    lineHeight: 1.1,
                  }}
                >
                  {data.memorial_name}
                </h1>

                {/* Years + IN MEMORY — mono warm subline */}
                <p
                  className="hl-mono"
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                    margin: '0 0 32px',
                    lineHeight: 1,
                  }}
                >
                  {(birthYear || deathYear)
                    ? `${birthYear ?? '—'} — ${deathYear ?? '—'}`
                    : 'IN MEMORY'}
                </p>

                {/* Epitaph — serif italic dim */}
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
                      margin: '0 0 36px',
                      maxWidth: '38ch',
                      textAlign: 'justify',
                    }}
                  >
                    {data.epitaph}
                  </p>
                )}

                {/* Hairline rule */}
                <div
                  style={{
                    height: 1,
                    background: 'var(--rule)',
                    margin: '0 0 36px',
                    maxWidth: 120,
                  }}
                />

                {/* Description / biography — serif reading block */}
                {data.memorial_description && (
                  <p
                    className="hl-serif"
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 18,
                      color: 'var(--bone)',
                      lineHeight: 1.75,
                      margin: '0 0 48px',
                      maxWidth: '62ch',
                      textAlign: 'justify',
                    }}
                  >
                    {data.memorial_description}
                  </p>
                )}
              </div>

              {/* ── Tributes — hairline-ruled list ── */}
              {data.tributes && data.tributes.length > 0 && (
                <div style={{ marginTop: 48 }}>
                  <SectionLabel>remembered moments</SectionLabel>

                  <div style={{ marginTop: 8 }}>
                    {data.tributes.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '18px 0',
                          borderBottom: '1px solid var(--rule)',
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
                              margin: '0 0 8px',
                            }}
                          >
                            {t.name}
                          </p>
                        )}
                        <p
                          className="hl-serif"
                          style={{
                            fontFamily: 'var(--serif)',
                            fontSize: 'var(--type-body)',
                            color: 'var(--bone-dim)',
                            lineHeight: 1.75,
                            margin: 0,
                            textAlign: 'justify',
                            maxWidth: '62ch',
                          }}
                        >
                          {t.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WaxSeal foot */}
              <div style={{ marginTop: 72, paddingBottom: 24 }}>
                <WaxSeal size={28} />
              </div>
            </>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
