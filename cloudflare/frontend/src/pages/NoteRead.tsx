import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';
import { ProgressHair } from '../loom/components/ProgressHair';
import { shareApi } from '../services/api';

interface SharedNote {
  title: string | null;
  salutation: string | null;
  body: string | null;
  signature: string | null;
  author: string;
}

const mono = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
  ...extra,
});

export function NoteRead() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery<SharedNote>({
    queryKey: ['shared-note', token],
    queryFn: () => shareApi.getNote(token!).then((r) => r.data),
    enabled: Boolean(token),
    retry: false,
  });

  return (
    <ClothShell
      topbarLeft={
        <Link
          to="/"
          style={{
            ...mono(),
            textDecoration: 'none',
          }}
        >
          ← heirloom
        </Link>
      }
      topbarCenter={<HLogo size={22} />}
    >
      <Helmet>
        <title>{data?.title ? `${data.title} — Heirloom` : 'A note — Heirloom'}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div
        style={{
          position: 'absolute',
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: 0,
          left: 0,
          right: 0,
          overflowY: 'auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: '44rem',
          margin: '0 auto',
        }}
      >
        {isLoading ? (
          <div style={{ paddingTop: '40vh' }}>
            <ProgressHair />
          </div>
        ) : isError ? (
          <div style={{ paddingTop: '40vh', textAlign: 'center' }}>
            <p style={{ ...mono({ marginBottom: 24 }), color: 'var(--bone-dim)' }}>
              This link is no longer available
            </p>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--bone-faint)', lineHeight: 1.6 }}>
              The note was revoked, or the family has set it back into the deep.
            </p>
          </div>
        ) : (
          <article>
            <p style={{ ...mono({ marginBottom: 32 }) }}>a note from {data?.author}</p>
            {data?.title ? (
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  lineHeight: 1.1,
                  color: 'var(--bone)',
                  margin: '0 0 1.5rem',
                  fontWeight: 400,
                }}
              >
                {data.title}
              </h1>
            ) : null}
            {data?.salutation ? (
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: '1.15rem',
                  color: 'var(--bone-dim)',
                  margin: '0 0 2rem',
                }}
              >
                {data.salutation}
              </p>
            ) : null}
            {data?.body ? (
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: '1.08rem',
                  lineHeight: 1.75,
                  color: 'var(--bone)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {data.body}
              </div>
            ) : null}
            {data?.signature ? (
              <p
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: '1.1rem',
                  color: 'var(--bone-dim)',
                  marginTop: '2.5rem',
                }}
              >
                {data.signature}
              </p>
            ) : null}
            <hr style={{ border: 0, borderTop: '1px solid var(--rule)', margin: '4rem 0 2rem' }} />
            <p style={{ ...mono(), lineHeight: 1.8 }}>
              Settled into the deep on Heirloom.
              <br />
              <Link to="/" style={{ color: 'var(--warm)', textDecoration: 'none' }}>
                Start your family's thread →
              </Link>
            </p>
          </article>
        )}
      </div>
    </ClothShell>
  );
}