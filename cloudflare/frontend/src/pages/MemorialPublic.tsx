import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { ProgressHair } from '../loom/components/ProgressHair';
import { memorialsApi } from '../services/api';

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
      <div
        style={{
          position: 'absolute',
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: 0,
          left: 0,
          right: 0,
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        <div style={{ maxWidth: 'var(--page-max-focus)', width: '100%', textAlign: 'center' }}>
          {isLoading && (
            <ProgressHair label="loading memorial…" />
          )}

          {!isLoading && (isError || !data) && (
            <p
              className="hl-serif hl-italic"
              style={{
                fontSize: 'var(--type-subhead)',
                color: 'var(--bone-faint)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              this memorial could not be found
            </p>
          )}

          {!isLoading && data && (
            <>
              {/* Infinity mark */}
              <div
                aria-hidden
                className="hl-serif"
                style={{
                  fontSize: 18,
                  color: 'var(--warm)',
                  opacity: 0.55,
                  margin: '0 0 44px',
                  lineHeight: 1,
                }}
              >
                ∞
              </div>

              {/* Name */}
              <h1
                className="hl-serif"
                style={{
                  fontVariationSettings: "'opsz' 32",
                  fontSize: 'var(--type-display)',
                  fontWeight: 200,
                  letterSpacing: '0.04em',
                  color: 'var(--bone)',
                  margin: '0 0 20px',
                }}
              >
                {data.memorial_name}
              </h1>

              {/* Years */}
              {(birthYear || deathYear) && (
                <p
                  className="hl-mono"
                  style={{
                    fontSize: 13,
                    letterSpacing: '0.24em',
                    color: 'var(--bone-dim)',
                    margin: '0 0 28px',
                  }}
                >
                  {birthYear ?? '—'} — {deathYear ?? '—'}
                </p>
              )}

              {/* Epitaph */}
              {data.epitaph && (
                <p
                  className="hl-serif hl-italic"
                  style={{
                    fontSize: 'var(--type-body-lg)',
                    color: 'var(--bone-dim)',
                    lineHeight: 1.7,
                    margin: '0 auto 44px',
                    maxWidth: '34ch',
                  }}
                >
                  {data.epitaph}
                </p>
              )}

              {/* Hairline rule */}
              <hr
                className="hl-rule"
                style={{ width: 120, margin: '0 auto 44px', border: 0, height: 1 }}
              />

              {/* Description / biography */}
              {data.memorial_description && (
                <p
                  className="hl-serif"
                  style={{
                    fontSize: 'var(--type-body)',
                    color: 'var(--bone-dim)',
                    lineHeight: 1.9,
                    margin: '0 auto 44px',
                    maxWidth: '46ch',
                  }}
                >
                  {data.memorial_description}
                </p>
              )}

              {/* Remembered moments */}
              {data.tributes && data.tributes.length > 0 && (
                <>
                  <div
                    className="hl-eyebrow"
                    style={{ marginBottom: 28, color: 'var(--bone-faint)' }}
                  >
                    remembered moments
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto', maxWidth: '40ch' }}>
                    {data.tributes.map((t) => (
                      <li key={t.id} style={{ margin: '0 0 26px' }}>
                        {t.name && (
                          <p
                            className="hl-mono"
                            style={{
                              fontSize: 11,
                              letterSpacing: '0.18em',
                              textTransform: 'uppercase',
                              color: 'var(--bone-faint)',
                              margin: '0 0 6px',
                            }}
                          >
                            {t.name}
                          </p>
                        )}
                        <p
                          className="hl-serif"
                          style={{
                            fontSize: 'var(--type-body)',
                            color: 'var(--bone-dim)',
                            lineHeight: 1.7,
                            margin: 0,
                          }}
                        >
                          {t.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
