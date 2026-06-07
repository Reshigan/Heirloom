import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useListener } from '../hooks/useListener';
import { useAuthStore } from '../stores/authStore';
import { aiApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { HLogo } from '../loom/components/HLogo';

/**
 * Screen 06 — The Listener (Echo)
 *
 * §1.5(C): the Listener is the ambient AI surface — one typographic line,
 * never a chatbot. Positioned at the floor of the screen, looking up.
 */
export function Echo() {
  const localPrompt = useListener();
  const { isAuthenticated } = useAuthStore();
  const [prompt, setPrompt] = useState<string>(localPrompt);
  const [promptId, setPromptId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    aiApi.getPrompt()
      .then(r => {
        if (r.data?.text) setPrompt(r.data.text);
        if (r.data?.id) setPromptId(r.data.id);
      })
      .catch(() => {}); // silent fallback to local prompt
  }, [isAuthenticated]);

  const [revealed, setRevealed] = useState(false);
  const [revealKey, setRevealKey] = useState(0);

  // Re-trigger reveal when prompt changes
  useEffect(() => {
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 120);
    return () => clearTimeout(t);
  }, [prompt, revealKey]);

  const [showWriteNudge, setShowWriteNudge] = useState(false);

  useEffect(() => {
    setShowWriteNudge(false);
    const t = setTimeout(() => setShowWriteNudge(true), 3000);
    return () => clearTimeout(t);
  }, [prompt]);

  function handlePromptInteract() {
    if (promptId) {
      aiApi.markPromptUsed(promptId).catch(() => {});
    }
  }

  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      topbarCenter="the listener"
      backdropOpacity={0.5}
    >
      <div style={{
        minHeight: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 24,
        paddingRight: 24,
        animation: 'hl-echo-breath 6s ease-in-out infinite',
      }}>
        <div
          style={{ textAlign: 'center', maxWidth: '52ch', width: '100%', cursor: promptId ? 'pointer' : 'default' }}
          onClick={handlePromptInteract}
        >
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 20, color: 'var(--bone-faint)' }}>
            the listener asks
          </span>
          <p
            className="hl-serif"
            style={{
              fontSize: 'clamp(18px, 4vw, 24px)',
              lineHeight: 1.6,
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--bone)',
              margin: 0,
              fontVariationSettings: '"opsz" 18',
            }}
            onClick={() => setRevealKey(k => k + 1)}
          >
            {prompt.split(' ').map((word, i) => (
              <span
                key={`${revealKey}-${i}`}
                style={{
                  display: 'inline-block',
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? 'translateY(0)' : 'translateY(6px)',
                  transition: `opacity 360ms cubic-bezier(0.16,1,0.3,1) ${80 + i * 65}ms, transform 360ms cubic-bezier(0.16,1,0.3,1) ${80 + i * 65}ms`,
                  marginRight: '0.28em',
                }}
              >
                {word}
              </span>
            ))}
          </p>
          <div style={{
            marginTop: 28,
            opacity: showWriteNudge ? 1 : 0,
            transform: showWriteNudge ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 720ms cubic-bezier(0.16,1,0.3,1), transform 720ms cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: showWriteNudge ? 'auto' : 'none',
          }}>
            <Link
              to="/compose"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--bone-faint)',
                textDecoration: 'none',
                transition: 'color 180ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone-dim)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
            >
              write about this →
            </Link>
          </div>
        </div>
      </div>
    </ClothShell>
  );
}
