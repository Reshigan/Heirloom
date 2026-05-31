import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 28 }}>Error 404</p>

        <h1
          className="loom-display"
          style={{
            fontSize: 'clamp(80px, 18vw, 160px)',
            fontWeight: 200,
            color: 'var(--loom-bone-faint)',
            margin: '0 0 28px',
            lineHeight: 1,
          }}
        >
          404
        </h1>

        <h2
          className="loom-h2"
          style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}
        >
          Page not found.
        </h2>
        <p
          className="loom-body"
          style={{ color: 'var(--loom-bone-dim)', margin: '0 auto 40px', lineHeight: 1.7 }}
        >
          The thread you're looking for has drifted from the warp. Let's find your way back.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="loom-btn-ghost"
          >
            go back
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="loom-btn"
          >
            return home
          </button>
        </div>
      </div>
    </main>
  );
}
