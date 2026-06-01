import { useListener } from '../../hooks/useListener';
import { Frame } from '../components/Frame';

/**
 * Screen 06 — The Listener (Echo)
 *
 * §1.5(C): the Listener is the ambient AI surface — one typographic line,
 * never a chatbot. Positioned at the floor of the screen, looking up.
 */
export function Echo() {
  const prompt = useListener();

  return (
    <Frame left="echo">
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 56,
      }}>
        <div style={{ textAlign: 'center', maxWidth: '52ch', padding: '0 32px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>
            the listener
          </span>
          <p
            className="hl-serif"
            style={{
              fontSize: 22,
              lineHeight: 1.5,
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--bone-dim)',
              margin: 0,
              fontVariationSettings: '"opsz" 18',
            }}
          >
            {prompt}
          </p>
        </div>
      </div>
    </Frame>
  );
}
