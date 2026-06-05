/**
 * SealedNote — typographic time-locked entry stamp.
 *
 * Two modes:
 *   interactive=true  — shows the WaxSeal opening ceremony first; after the
 *                       ceremony the typographic stamp fades in and onOpened()
 *                       fires. Used wherever the user must actively unseal.
 *   interactive=false — plain typographic stamp (default). Used in the
 *                       Composer's right rail where it is display-only.
 */
import { useState } from 'react';
import { WaxSeal } from './WaxSeal';

interface Props {
  date: string;
  recipient: string;
  sublabel?: string;
  italic?: boolean;
  interactive?: boolean;
  onOpened?: () => void;
}

export function SealedNote({
  date,
  recipient,
  sublabel,
  italic = true,
  interactive = false,
  onOpened,
}: Props) {
  const [opened, setOpened] = useState(false);

  if (interactive && !opened) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        padding: '24px 0',
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          textAlign: 'center',
        }}>
          sealed · {date}
        </div>
        <WaxSeal
          label={recipient}
          size={96}
          onOpened={() => {
            setOpened(true);
            onOpened?.();
          }}
        />
        <div style={{
          fontFamily: 'var(--serif)',
          fontSize: 14,
          fontStyle: 'italic',
          color: 'var(--bone-dim)',
          textAlign: 'center',
          maxWidth: '22ch',
          lineHeight: 1.55,
        }}>
          for {italic ? <em>{recipient}</em> : recipient}
        </div>
      </div>
    );
  }

  return (
    <div
      className="loom-sealed"
      style={interactive && opened ? {
        animation: 'hl-sealed-reveal 720ms cubic-bezier(0.16,1,0.3,1) both',
      } : undefined}
    >
      <style>{`
        @keyframes hl-sealed-reveal {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
      <span className="infmark">∞</span>
      <div className="meta">{date}</div>
      <div className="for">{italic ? <em>{recipient}</em> : recipient}</div>
      {sublabel ? (
        <div className="meta loom-dim" style={{ marginTop: 6, fontSize: 10 }}>
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}
