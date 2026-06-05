import { useEffect, useState } from 'react';
import { useListener } from '../../hooks/useListener';
import { useAuthStore } from '../../stores/authStore';
import { aiApi } from '../../services/api';
import { ClothShell } from '../components/ClothShell';
import { HLogo } from '../components/HLogo';

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
          >
            {prompt}
          </p>
        </div>
      </div>
    </ClothShell>
  );
}
