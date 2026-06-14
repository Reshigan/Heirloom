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
        <div style={{ maxWidth: 'var(--page-max-wide)', width: '100%' }}>
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
              {/* Name */}
              <h1
                className="hl-serif hl-tight"
                style={{
                  fontVariationSettings: "'opsz' 32",
                  fontSize: 'var(--type-display)',
                  fontWeight: 300,
                  color: 'var(--bone)',
                  margin: '0 0 12px',
                }}
              >
                {data.memorial_name}
              </h1>

              {/* Years */}
              {(birthYear || deathYear) && (
                <p
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    letterSpacing: '0.18em',
                    color: 'var(--bone-faint)',
                    margin: '0 0 36px',
                  }}
                >
                  {birthYear ?? '—'} – {deathYear ?? '—'}
                </p>
              )}

              {/* Epitaph */}
              {data.epitaph && (
                <p
                  className="hl-prose"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 'clamp(16px, 3vw, 18px)',
                    fontStyle: 'italic',
                    color: 'var(--bone-dim)',
                    lineHeight: 1.8,
                    margin: '0 0 32px',
                    borderLeft: '3px solid var(--warm)',
                    paddingLeft: 20,
                  }}
                >
                  {data.epitaph}
                </p>
              )}

              {/* Description / biography */}
              {data.memorial_description && (
                <p
                  className="hl-serif hl-prose"
                  style={{
                    fontSize: 'var(--type-body)',
                    color: 'var(--bone-dim)',
                    lineHeight: 1.9,
                    margin: 0,
                  }}
                >
                  {data.memorial_description}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </ClothShell>
  );
}
