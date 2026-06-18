import { Navigate, useNavigate } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { useAuthStore } from '../stores/authStore';

/**
 * Screen 01 — The Threshold
 *
 * The anonymous arrival, set as a centred ceremony. A mono eyebrow names the
 * threshold; the global filament backdrop carries the single glowing ∞ behind
 * the column (we paint none of our own so they don't double up); the thesis is
 * set large in serif with its quiet bloodline sub beneath; then the entry
 * ceremony — a solid filled amber ENTER bar that runs the one door, "start
 * your thread." We do not ask for an account or a name here.
 */

export function Threshold() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // `/loom` is wired as "home" across the whole app — breadcrumbs, back-links,
  // post-login, post-join, post-purchase. This screen is the anonymous brand
  // splash, not the visitor's own home. Forward a signed-in visitor to their
  // real home so every one of those links lands correctly from this single
  // guard. Anonymous visitors keep the splash.
  if (isAuthenticated) return <Navigate to="/loom/pwa" replace />;

  // The one door — the entry ceremony begins a new thread. (Preserved from the
  // original threshold CTA: addRoute="/signup".)
  const enter = () => navigate('/signup');

  return (
    <ClothShell noTopbar>
      {/* A single centred ceremony column over the global filament backdrop —
          the glowing ∞ behind belongs to ClothBackdrop, not to this page. */}
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '100%',
          padding: 'clamp(40px,9vh,120px) clamp(24px,6vw,48px)',
          textAlign: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mono eyebrow — names the threshold, kept above the h1 tagline */}
          <div
            className="hl-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
            }}
          >
            the threshold
          </div>

          {/* Negative space holds the glowing ∞ from the global backdrop. */}
          <div style={{ height: 'clamp(140px, 26vh, 240px)' }} aria-hidden />

          {/* Serif thesis — type is the hero */}
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 'clamp(30px, 7vw, 50px)',
              fontWeight: 500,
              lineHeight: 1.12,
              letterSpacing: '-0.012em',
              color: 'var(--bone)',
              margin: 0,
              fontVariationSettings: '"opsz" 40',
            }}
          >
            Start your family&rsquo;s<br />thousand-year thread,
          </h1>

          {/* Quiet bloodline sub */}
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 16,
              lineHeight: 1.5,
              color: 'var(--bone-dim)',
              margin: '18px auto 0',
              maxWidth: '28em',
            }}
          >
            a perpetual archive owned by a bloodline.
          </p>

          {/* Entry ceremony — mono label, then the solid amber ENTER bar */}
          <div
            className="hl-mono"
            style={{
              marginTop: 'clamp(48px, 9vh, 88px)',
              marginBottom: 16,
              fontSize: 10,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
            }}
          >
            entry ceremony
          </div>

          <button
            type="button"
            onClick={enter}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: 'transparent',
              border: '1px solid var(--warm)',
              borderRadius: 0,
              color: 'var(--warm)',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'border-color 180ms var(--ease), color 180ms var(--ease)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--warm-bright)'; e.currentTarget.style.color = 'var(--warm-bright)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--warm)'; e.currentTarget.style.color = 'var(--warm)'; }}
          >
            enter
          </button>
        </div>
      </div>
    </ClothShell>
  );
}
